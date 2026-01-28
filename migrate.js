// Script để migrate database sang schema mới
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'classroom.db');
const db = new sqlite3.Database(dbPath);

console.log('🔄 Bắt đầu migration database...');

db.serialize(() => {
    // Kiểm tra và thêm cột session_id vào bảng seats
    db.all("PRAGMA table_info(seats)", (err, columns) => {
        if (err) {
            console.error('❌ Lỗi khi kiểm tra bảng seats:', err);
            return;
        }

        const hasSessionId = columns.some(col => col.name === 'session_id');
        const hasUserAgent = columns.some(col => col.name === 'user_agent');

        if (!hasSessionId) {
            console.log('📝 Thêm cột session_id vào bảng seats...');
            db.run('ALTER TABLE seats ADD COLUMN session_id TEXT', (err) => {
                if (err) {
                    console.error('❌ Lỗi khi thêm session_id:', err);
                } else {
                    console.log('✅ Đã thêm cột session_id vào bảng seats');
                }
            });
        } else {
            console.log('✓ Cột session_id đã tồn tại trong bảng seats');
        }

        if (!hasUserAgent) {
            console.log('📝 Thêm cột user_agent vào bảng seats...');
            db.run('ALTER TABLE seats ADD COLUMN user_agent TEXT', (err) => {
                if (err) {
                    console.error('❌ Lỗi khi thêm user_agent:', err);
                } else {
                    console.log('✅ Đã thêm cột user_agent vào bảng seats');
                }
            });
        } else {
            console.log('✓ Cột user_agent đã tồn tại trong bảng seats');
        }
    });

    // Tạo lại bảng ip_tracking với schema mới
    console.log('📝 Cập nhật bảng ip_tracking...');
    db.run('DROP TABLE IF EXISTS ip_tracking_old', (err) => {
        if (err) console.error('Lỗi khi xóa bảng tạm:', err);
        
        db.run('ALTER TABLE ip_tracking RENAME TO ip_tracking_old', (err) => {
            if (err) {
                console.log('✓ Bảng ip_tracking chưa tồn tại hoặc đã được cập nhật');
                return;
            }

            // Tạo bảng mới với schema đúng
            db.run(`
                CREATE TABLE ip_tracking (
                    session_id TEXT PRIMARY KEY,
                    ip_address TEXT,
                    user_agent TEXT,
                    submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `, (err) => {
                if (err) {
                    console.error('❌ Lỗi khi tạo bảng ip_tracking mới:', err);
                    return;
                }

                console.log('✅ Đã tạo bảng ip_tracking với schema mới');

                // Migration dữ liệu cũ (nếu có)
                db.run(`
                    INSERT OR IGNORE INTO ip_tracking (session_id, ip_address, submitted_at)
                    SELECT ip_address as session_id, ip_address, submitted_at
                    FROM ip_tracking_old
                `, (err) => {
                    if (err) {
                        console.error('⚠️ Lỗi khi migrate dữ liệu:', err);
                    } else {
                        console.log('✅ Đã migrate dữ liệu từ bảng cũ');
                    }

                    // Xóa bảng cũ
                    db.run('DROP TABLE IF EXISTS ip_tracking_old', (err) => {
                        if (err) {
                            console.error('⚠️ Lỗi khi xóa bảng cũ:', err);
                        } else {
                            console.log('✅ Đã xóa bảng cũ');
                        }

                        console.log('\n🎉 Migration hoàn tất!');
                        console.log('📌 Bây giờ mỗi browser sẽ được tracking riêng biệt');
                        console.log('📌 Khởi động lại server để áp dụng thay đổi\n');
                        
                        db.close();
                    });
                });
            });
        });
    });
});
