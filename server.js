const express = require('express');
const path = require('path');
const db = require('./database');
require('dotenv').config();

const app = express();
const ADMIN_KEY = process.env.ADMIN_KEY || 'admin123';
const PORT = process.env.PORT || 3000;

// Cho phép Express lấy IP đúng khi chạy đằng sau proxy
app.set('trust proxy', true);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Lấy IP của client
function getClientIP(req) {
    // Thử lấy từ headers trước (nếu có proxy)
    let ip = req.headers['x-forwarded-for'] ||
        req.headers['x-real-ip'] ||
        req.connection.remoteAddress ||
        req.socket.remoteAddress ||
        (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
        req.ip;

    // Nếu là ::1 (IPv6 localhost) hoặc ::ffff:127.0.0.1, chuyển sang 127.0.0.1
    if (ip === '::1' || ip === '::ffff:127.0.0.1') {
        ip = '127.0.0.1';
    }

    // Nếu có nhiều IP (từ x-forwarded-for), lấy IP đầu tiên
    if (ip && ip.includes(',')) {
        ip = ip.split(',')[0].trim();
    }

    // Loại bỏ prefix IPv6 nếu có (::ffff:192.168.1.1 -> 192.168.1.1)
    if (ip && ip.startsWith('::ffff:')) {
        ip = ip.substring(7);
    }

    return ip;
}

// Route: Trang chủ cho user
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Route: Trang admin
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// API: Xác thực admin key
app.post('/api/admin/verify', (req, res) => {
    const { key } = req.body;

    if (key === ADMIN_KEY) {
        res.json({ success: true, message: 'Xác thực thành công' });
    } else {
        res.status(401).json({ success: false, message: 'Key không đúng' });
    }
});

// API: Lấy tất cả chỗ ngồi
app.get('/api/seats', (req, res) => {
    db.all('SELECT * FROM seats ORDER BY row, section, col', (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

// API: Lấy chỗ ngồi cho user (ẩn tên người khác)
app.post('/api/seats/user', (req, res) => {
    const { sessionId } = req.body;

    db.all('SELECT * FROM seats ORDER BY row, section, col', (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        // Ẩn tên sinh viên, chỉ hiển thị chỗ đã có người ngồi
        const sanitizedRows = rows.map(seat => ({
            id: seat.id,
            row: seat.row,
            col: seat.col,
            section: seat.section,
            occupied: !!(seat.first_name && seat.last_name),
            isMyIP: sessionId && seat.session_id === sessionId
        }));

        res.json(sanitizedRows);
    });
});

// API: Kiểm tra session đã submit chưa
app.post('/api/check-session', (req, res) => {
    const { sessionId } = req.body;
    const clientIP = getClientIP(req);

    if (!sessionId) {
        return res.status(400).json({ error: 'Session ID required' });
    }

    db.get('SELECT * FROM ip_tracking WHERE session_id = ?', [sessionId], (err, row) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ hasSubmitted: !!row, ip: clientIP });
    });
});

// API: User submit tên
app.post('/api/submit-seat', (req, res) => {
    const { seatId, firstName, lastName, sessionId } = req.body;
    const clientIP = getClientIP(req);
    const userAgent = req.headers['user-agent'] || 'Unknown';

    if (!seatId || !firstName || firstName.trim() === '' || !lastName || lastName.trim() === '') {
        return res.status(400).json({ error: 'Vui lòng nhập đầy đủ Họ và Tên' });
    }

    if (!sessionId) {
        return res.status(400).json({ error: 'Session ID required' });
    }

    // Kiểm tra session đã submit chưa
    db.get('SELECT * FROM ip_tracking WHERE session_id = ?', [sessionId], (err, row) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        if (row) {
            return res.status(403).json({ error: 'Bạn đã Điểm danh rồi!' });
        }

        // Kiểm tra chỗ ngồi còn trống không
        db.get('SELECT * FROM seats WHERE id = ?', [seatId], (err, seat) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }

            if (!seat) {
                return res.status(404).json({ error: 'Chỗ ngồi không tồn tại' });
            }

            if (seat.first_name || seat.last_name) {
                return res.status(409).json({ error: 'Chỗ ngồi đã có người' });
            }

            // Cập nhật chỗ ngồi và tracking session
            db.run(
                'UPDATE seats SET first_name = ?, last_name = ?, ip_address = ?, session_id = ?, user_agent = ? WHERE id = ?',
                [firstName.trim(), lastName.trim(), clientIP, sessionId, userAgent, seatId],
                function (err) {
                    if (err) {
                        return res.status(500).json({ error: err.message });
                    }

                    db.run(
                        'INSERT INTO ip_tracking (session_id, ip_address, user_agent) VALUES (?, ?, ?)',
                        [sessionId, clientIP, userAgent],
                        (err) => {
                            if (err) {
                                return res.status(500).json({ error: err.message });
                            }
                            res.json({ success: true, message: 'Đăng ký thành công!' });
                        }
                    );
                }
            );
        });
    });
});

// API: Admin lấy danh sách sinh viên theo A-Z (sắp xếp theo Tên)
app.get('/api/admin/students', (req, res) => {
    db.all(
        `SELECT first_name, last_name, row, col, section, created_at 
     FROM seats 
     WHERE first_name IS NOT NULL AND last_name IS NOT NULL 
     ORDER BY last_name ASC, first_name ASC`,
        (err, rows) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.json(rows);
        }
    );
});

// API: Admin xóa tất cả dữ liệu (reset)
app.post('/api/admin/reset', (req, res) => {
    db.run('UPDATE seats SET first_name = NULL, last_name = NULL, ip_address = NULL, session_id = NULL, user_agent = NULL', (err) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        db.run('DELETE FROM ip_tracking', (err) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.json({ success: true, message: 'Đã reset toàn bộ dữ liệu' });
        });
    });
});

// API: Lấy cấu hình lớp học
app.get('/api/admin/settings', (req, res) => {
    db.get('SELECT * FROM settings WHERE id = 1', (err, row) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(row || { rows: 6, left_cols: 2, middle_cols: 4, right_cols: 2 });
    });
});

// API: Cập nhật cấu hình lớp học
app.post('/api/admin/settings', (req, res) => {
    const { rows, left_cols, middle_cols, right_cols } = req.body;

    // Validate
    if (!rows || !left_cols || !middle_cols || !right_cols) {
        return res.status(400).json({ error: 'Vui lòng nhập đầy đủ thông tin' });
    }

    if (rows < 1 || rows > 20 || left_cols < 0 || left_cols > 10 ||
        middle_cols < 0 || middle_cols > 10 || right_cols < 0 || right_cols > 10) {
        return res.status(400).json({ error: 'Giá trị không hợp lệ' });
    }

    // Cập nhật settings
    db.run(
        `UPDATE settings SET rows = ?, left_cols = ?, middle_cols = ?, right_cols = ?, updated_at = CURRENT_TIMESTAMP WHERE id = 1`,
        [rows, left_cols, middle_cols, right_cols],
        function (err) {
            if (err) {
                return res.status(500).json({ error: err.message });
            }

            // Tái khởi tạo chỗ ngồi
            db.reinitializeSeats((err) => {
                if (err) {
                    return res.status(500).json({ error: 'Lỗi khi khởi tạo chỗ ngồi: ' + err.message });
                }
                res.json({ success: true, message: 'Đã cập nhật cấu hình thành công!' });
            });
        }
    );
});

// Start server
app.listen(PORT, () => {
    console.log(`Server đang chạy tại http://localhost:${PORT}`);
    console.log(`Trang admin: http://localhost:${PORT}/admin`);
});
