# 🎓 Classroom Seating Management System

## Mô tả
Hệ thống quản lý chỗ ngồi lớp học với NodeJS, Express và SQLite. Hỗ trợ cấu hình linh hoạt số hàng và số cột cho từng dãy, xác thực admin bằng key, và giao diện responsive cho mobile.

## Cấu trúc lớp học
- **3 dãy bàn** với cấu hình linh hoạt
  - Dãy trái: Có thể cấu hình 0-10 chỗ ngồi/hàng
  - Dãy giữa: Có thể cấu hình 0-10 chỗ ngồi/hàng
  - Dãy phải: Có thể cấu hình 0-10 chỗ ngồi/hàng
- **Số hàng**: Có thể cấu hình 1-20 hàng
- **Cấu hình mặc định**: 6 hàng × (2 + 4 + 2) = 48 chỗ ngồi

## Tính năng

### Người dùng (User)
- ✅ Xem sơ đồ chỗ ngồi lớp học (responsive mobile-friendly)
- ✅ Chọn và đăng ký 1 chỗ ngồi duy nhất
- ✅ Nhập Họ và Tên riêng biệt
- ✅ Chặn IP - mỗi IP chỉ đăng ký 1 lần
- ✅ Xem lại chỗ ngồi đã đăng ký
- ✅ Giao diện tự động cập nhật

### Quản trị viên (Admin)
- 🔐 **Xác thực bằng Admin Key**
- ✅ Xem toàn bộ sơ đồ với họ tên sinh viên
- ✅ Xem thống kê chỗ ngồi (tổng/đã đăng ký/còn trống)
- ✅ **Cấu hình lớp học** (số hàng, số cột mỗi dãy)
- ✅ Xuất danh sách sinh viên theo thứ tự A-Z (sắp xếp theo Tên)
- ✅ Reset toàn bộ dữ liệu
- ✅ Tự động làm mới mỗi 5 giây
- ✅ Giao diện mobile-friendly với 3 dãy hiển thị cùng lúc

## Cài đặt

### Yêu cầu hệ thống
- Node.js >= 14.x
- npm >= 6.x

### 1. Clone hoặc tải project
```bash
cd ClassroomSeating
```

### 2. Cài đặt dependencies
```bash
npm install
```

### 3. Cấu hình (Tùy chọn)
Tạo file `.env` trong thư mục gốc:
```bash
PORT=3000
ADMIN_KEY=your_secure_admin_key_here
```

**Lưu ý**: Nếu không có file `.env`, admin key mặc định là `admin123`

### 4. Chạy server

#### Cách 1: Chạy thông thường
```bash
npm start
```

#### Cách 2: Chạy với PM2 (Ubuntu/Linux Production)

**Cài đặt PM2 (nếu chưa có):**
```bash
sudo npm install -g pm2
```

**Chạy project với PM2:**
```bash
# Khởi động ứng dụng
pm2 start server.js --name classroom-seating

# Xem danh sách các ứng dụng đang chạy
pm2 list

# Xem logs
pm2 logs classroom-seating

# Dừng ứng dụng
pm2 stop classroom-seating

# Khởi động lại ứng dụng
pm2 restart classroom-seating

# Xóa khỏi PM2
pm2 delete classroom-seating

# Lưu cấu hình PM2 để tự động khởi động khi server reboot
pm2 save
pm2 startup
```

**Cấu hình nâng cao với PM2 ecosystem:**
Tạo file `ecosystem.config.js`:
```javascript
module.exports = {
  apps: [{
    name: 'classroom-seating',
    script: './server.js',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      ADMIN_KEY: 'your_secure_admin_key'
    }
  }]
};
```

Sau đó chạy:
```bash
pm2 start ecosystem.config.js
```

### 5. Truy cập
- **User**: http://localhost:3000
- **Admin**: http://localhost:3000/admin
  - Yêu cầu nhập Admin Key (mặc định: `admin123`)

## Công nghệ sử dụng
- **Backend**: Node.js + Express
- **Database**: SQLite3
- **Frontend**: HTML5 + CSS3 + Vanilla JavaScript
- **Authentication**: Admin Key (via .env)
- **Process Manager**: PM2 (optional, for production)
- **Port mặc định**: 3000

## Cấu trúc thư mục
```
ClassroomSeating/
├── server.js              # Express server
├── database.js            # SQLite configuration & initialization
├── migrate.js             # Database migration script
├── package.json           # Dependencies
├── .env                   # Environment variables (tạo thủ công)
├── classroom.db           # SQLite database (auto-generated)
├── FIX_ATTENDANCE_TRACKING.md  # Documentation
└── public/
    ├── index.html         # User interface (responsive)
    └── admin.html         # Admin interface (responsive)
```

## API Endpoints

### User APIs
- `GET /` - Trang chủ user
- `GET /api/seats/user` - Lấy danh sách chỗ ngồi (ẩn họ tên)
- `GET /api/check-ip` - Kiểm tra IP đã đăng ký chưa
- `POST /api/submit-seat` - Đăng ký chỗ ngồi (yêu cầu: seatId, firstName, lastName)

### Admin APIs
- `GET /admin` - Trang admin (yêu cầu xác thực)
- `POST /api/admin/verify` - Xác thực admin key
- `GET /api/seats` - Lấy toàn bộ chỗ ngồi với họ tên
- `GET /api/admin/students` - Danh sách sinh viên A-Z (sắp xếp theo Tên)
- `GET /api/admin/settings` - Lấy cấu hình lớp học
- `POST /api/admin/settings` - Cập nhật cấu hình (rows, left_cols, middle_cols, right_cols)
- `POST /api/admin/reset` - Reset toàn bộ dữ liệu (xóa sinh viên, giữ cấu hình)

## Database Schema

### Table: seats
```sql
id              INTEGER PRIMARY KEY
row             INTEGER NOT NULL
col             INTEGER NOT NULL
section         TEXT NOT NULL (left/middle/right)
first_name      TEXT
last_name       TEXT
ip_address      TEXT
created_at      DATETIME
```

### Table: ip_tracking
```sql
ip_address      TEXT PRIMARY KEY
submitted_at    DATETIME
```

### Table: settings
```sql
id              INTEGER PRIMARY KEY (always 1)
rows            INTEGER DEFAULT 6
left_cols       INTEGER DEFAULT 2
middle_cols     INTEGER DEFAULT 4
right_cols      INTEGER DEFAULT 2
```

## Lưu ý
- 🔒 **Bảo mật**: Mỗi IP chỉ được đăng ký 1 lần duy nhất
- 🔑 **Admin Key**: Nên thay đổi admin key mặc định bằng cách tạo file `.env`
- ⚙️ **Cấu hình động**: Admin có thể thay đổi cấu hình lớp học (sẽ xóa dữ liệu hiện tại)
- 🔄 **Auto Refresh**: Giao diện tự động refresh mỗi 5 giây
- 💾 **Database**: File `classroom.db` sẽ tự động tạo khi chạy lần đầu
- 📱 **Mobile Friendly**: Giao diện responsive, hiển thị tốt trên mobile (40×40px seats)
- 🌐 **Production**: Nên dùng PM2 để quản lý process khi deploy lên production
- 🔧 **Proxy**: Server hỗ trợ lấy IP đúng khi chạy sau proxy/nginx

## Troubleshooting

### Database bị lỗi
```bash
# Xóa database và tạo lại
rm classroom.db
node server.js
```

### Quên Admin Key
Kiểm tra file `.env` hoặc xem log server khi khởi động. Nếu không có `.env`, key mặc định là `admin123`

### PM2 không tự động start khi reboot
```bash
pm2 save
pm2 startup
# Chạy lệnh mà PM2 gợi ý (với sudo)
```

## License
ISC

## Tác giả
Classroom Seating Management System - 2026
