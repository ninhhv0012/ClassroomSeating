# Hướng dẫn sửa lỗi tracking điểm danh

## 🔍 Vấn đề đã được phát hiện

Hệ thống trước đây chỉ dựa vào **địa chỉ IP** để tracking điểm danh. Điều này gây ra vấn đề:
- Nhiều máy trong cùng mạng LAN có cùng IP public → bị nhận là cùng 1 người
- Khi chạy qua proxy/reverse proxy → tất cả máy bị nhận là IP của proxy
- Khi test local → tất cả đều là 127.0.0.1

## ✅ Giải pháp đã áp dụng

Hệ thống mới sử dụng **Session ID unique** cho mỗi browser:
- Tạo fingerprint từ: timestamp + random + thông tin browser (user agent, màn hình, múi giờ, ngôn ngữ)
- Lưu vào localStorage của browser
- Mỗi browser sẽ có 1 session ID riêng, không trùng lặp

## 📋 Các bước để áp dụng

### Bước 1: Dừng server đang chạy
```bash
# Nhấn Ctrl+C trong terminal đang chạy server
```

### Bước 2: Chạy migration để cập nhật database
```bash
node migrate.js
```

### Bước 3: Khởi động lại server
```bash
node server.js
```

### Bước 4: Kiểm tra
- Mở nhiều trình duyệt khác nhau (Chrome, Firefox, Edge...)
- Hoặc mở nhiều cửa sổ ẩn danh (Incognito)
- Mỗi browser sẽ được tracking độc lập

## 🔄 Reset lại dữ liệu (nếu cần)

Nếu muốn xóa toàn bộ dữ liệu điểm danh cũ:
1. Vào trang Admin: http://localhost:3000/admin
2. Nhập admin key
3. Nhấn nút "Reset All Data"

## 🧪 Test trên nhiều máy

Để test trên nhiều máy thật:
1. Tìm IP local của server: `ipconfig` (Windows) hoặc `ifconfig` (Linux/Mac)
2. Truy cập từ máy khác: `http://<IP_của_máy_server>:3000`
3. Mỗi máy/browser sẽ được tracking riêng

## 📝 Lưu ý quan trọng

- **Xóa localStorage**: Nếu muốn test lại trên cùng 1 browser, cần xóa localStorage:
  - Mở Developer Tools (F12)
  - Tab Application → Local Storage → xóa key `sessionId`
  - Hoặc dùng chế độ ẩn danh (Incognito/Private)

- **Database backup**: File `classroom.db` chứa toàn bộ dữ liệu, nên backup trước khi chạy migration

## 🛠️ Các thay đổi kỹ thuật

### Database
- Thêm cột `session_id` và `user_agent` vào bảng `seats`
- Thay đổi bảng `ip_tracking` để dùng `session_id` làm PRIMARY KEY
- Vẫn giữ `ip_address` để tham khảo

### Backend (server.js)
- API `/api/check-ip` → `/api/check-session` (POST)
- API `/api/seats/user` thay đổi từ GET → POST để nhận sessionId
- API `/api/submit-seat` thêm xác thực sessionId

### Frontend (index.html)
- Tạo function `getSessionId()` để generate unique session
- Browser fingerprint từ: UserAgent + Screen + Timezone + Language
- Lưu sessionId vào localStorage để persistent
- Gửi sessionId trong mọi request

## 🎯 Kết quả

Sau khi áp dụng:
- ✅ Mỗi browser được tracking riêng biệt
- ✅ Không còn bị nhầm lẫn giữa các máy khác nhau
- ✅ Vẫn giữ được trạng thái khi refresh trang
- ✅ Admin vẫn thấy được IP để tham khảo
