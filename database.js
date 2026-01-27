const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'classroom.db');
const db = new sqlite3.Database(dbPath);

// Khởi tạo database
db.serialize(() => {
    // Bảng lưu thông tin chỗ ngồi
    db.run(`
    CREATE TABLE IF NOT EXISTS seats (
      id INTEGER PRIMARY KEY,
      row INTEGER NOT NULL,
      col INTEGER NOT NULL,
      section TEXT NOT NULL,
      first_name TEXT,
      last_name TEXT,
      ip_address TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(row, col, section)
    )
  `);

    // Bảng theo dõi IP đã submit
    db.run(`
    CREATE TABLE IF NOT EXISTS ip_tracking (
      ip_address TEXT PRIMARY KEY,
      submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

    // Bảng lưu cấu hình lớp học
    db.run(`
    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      rows INTEGER NOT NULL DEFAULT 6,
      left_cols INTEGER NOT NULL DEFAULT 2,
      middle_cols INTEGER NOT NULL DEFAULT 4,
      right_cols INTEGER NOT NULL DEFAULT 2,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

    // Khởi tạo settings mặc định
    db.run(`
    INSERT OR IGNORE INTO settings (id, rows, left_cols, middle_cols, right_cols)
    VALUES (1, 6, 2, 4, 2)
  `);

    // Khởi tạo settings mặc định
    db.run(`
    INSERT OR IGNORE INTO settings (id, rows, left_cols, middle_cols, right_cols)
    VALUES (1, 6, 2, 4, 2)
  `);

    // Hàm khởi tạo chỗ ngồi dựa trên settings
    const initializeSeats = () => {
        db.get('SELECT * FROM settings WHERE id = 1', (err, settings) => {
            if (err || !settings) return;

            // Khởi tạo chỗ ngồi theo cấu hình
            const initSeats = db.prepare(`
        INSERT OR IGNORE INTO seats (id, row, col, section) VALUES (?, ?, ?, ?)
      `);

            let seatId = 1;
            for (let row = 1; row <= settings.rows; row++) {
                // Left section
                for (let col = 1; col <= settings.left_cols; col++) {
                    initSeats.run(seatId++, row, col, 'left');
                }
                // Middle section
                for (let col = 1; col <= settings.middle_cols; col++) {
                    initSeats.run(seatId++, row, col, 'middle');
                }
                // Right section
                for (let col = 1; col <= settings.right_cols; col++) {
                    initSeats.run(seatId++, row, col, 'right');
                }
            }
            initSeats.finalize();
        });
    };

    // Khởi tạo chỗ ngồi ban đầu
    initializeSeats();
});

// Export hàm để tái khởi tạo seats khi settings thay đổi
db.reinitializeSeats = function (callback) {
    db.run('DELETE FROM seats', (err) => {
        if (err) return callback(err);

        db.run('DELETE FROM ip_tracking', (err) => {
            if (err) return callback(err);

            db.get('SELECT * FROM settings WHERE id = 1', (err, settings) => {
                if (err || !settings) return callback(err);

                const initSeats = db.prepare(`
          INSERT INTO seats (id, row, col, section) VALUES (?, ?, ?, ?)
        `);

                let seatId = 1;
                for (let row = 1; row <= settings.rows; row++) {
                    for (let col = 1; col <= settings.left_cols; col++) {
                        initSeats.run(seatId++, row, col, 'left');
                    }
                    for (let col = 1; col <= settings.middle_cols; col++) {
                        initSeats.run(seatId++, row, col, 'middle');
                    }
                    for (let col = 1; col <= settings.right_cols; col++) {
                        initSeats.run(seatId++, row, col, 'right');
                    }
                }
                initSeats.finalize(callback);
            });
        });
    });
};

module.exports = db;
