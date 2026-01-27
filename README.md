# Classroom Seating Management System

## Mô tả
Hệ thống quản lý chỗ ngồi lớp học với NodeJS, Express và SQLite.

## Cấu trúc lớp học
- **3 dãy bàn** × **6 hàng**
  - Dãy trái: 2 chỗ ngồi/hàng
  - Dãy giữa: 4 chỗ ngồi/hàng  
  - Dãy phải: 2 chỗ ngồi/hàng
- **Tổng cộng: 48 chỗ ngồi**

## Tính năng

### Người dùng (User)
- ✅ Xem sơ đồ chỗ ngồi lớp học
- ✅ Chọn và đăng ký 1 chỗ ngồi duy nhất
- ✅ Chặn IP - mỗi IP chỉ đăng ký 1 lần
- ✅ Tự động cập nhật real-time

### Quản trị viên (Admin)
- ✅ Xem toàn bộ sơ đồ với tên sinh viên
- ✅ Xem thống kê chỗ ngồi
- ✅ Xuất danh sách sinh viên theo thứ tự A-Z
- ✅ Reset toàn bộ dữ liệu
- ✅ Tự động làm mới mỗi 5 giây

## Cài đặt

1. Cài đặt dependencies:
```bash
cd ClassroomSeating
npm install
```

2. Chạy server:
```bash
npm start
```

3. Truy cập:
- **User**: http://localhost:3000
- **Admin**: http://localhost:3000/admin

## Công nghệ sử dụng
- **Backend**: Node.js + Express
- **Database**: SQLite3
- **Frontend**: HTML5 + CSS3 + Vanilla JavaScript
- **Port**: 3000

## Cấu trúc thư mục
```
ClassroomSeating/
├── server.js           # Express server
├── database.js         # SQLite configuration
├── package.json        # Dependencies
├── classroom.db        # SQLite database (auto-generated)
└── public/
    ├── index.html      # User interface
    └── admin.html      # Admin interface
```

## API Endpoints

### User APIs
- `GET /` - Trang chủ user
- `GET /api/seats/user` - Lấy danh sách chỗ ngồi (ẩn tên)
- `GET /api/check-ip` - Kiểm tra IP đã submit chưa
- `POST /api/submit-seat` - Điểm danh

### Admin APIs
- `GET /admin` - Trang admin
- `GET /api/seats` - Lấy toàn bộ chỗ ngồi với tên
- `GET /api/admin/students` - Danh sách sinh viên A-Z
- `POST /api/admin/reset` - Reset toàn bộ dữ liệu

## Database Schema

### Table: seats
```sql
id              INTEGER PRIMARY KEY
row             INTEGER NOT NULL
col             INTEGER NOT NULL
section         TEXT NOT NULL (left/middle/right)
student_name    TEXT
ip_address      TEXT
created_at      DATETIME
```

### Table: ip_tracking
```sql
ip_address      TEXT PRIMARY KEY
submitted_at    DATETIME
```

## Lưu ý
- Mỗi IP chỉ được đăng ký 1 lần duy nhất
- Admin có thể reset toàn bộ dữ liệu
- Giao diện tự động refresh mỗi 5 giây
- File database sẽ tự động tạo khi chạy lần đầu

## Tác giả
Classroom Seating Management System - 2026
