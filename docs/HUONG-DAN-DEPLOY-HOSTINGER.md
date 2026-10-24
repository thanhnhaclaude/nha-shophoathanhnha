# Deploy shophoathanhnha.com lên Hostinger (gói Business / Cloud)

Website là ứng dụng **Node.js + Express**. Hostinger chạy nó bằng tính năng **Node.js Web App** và tự deploy lại mỗi khi bạn push code lên GitHub.

## 1. Tạo ứng dụng Node.js

1. Đăng nhập **hPanel**, chọn **Websites → Add website → Node.js Apps**. Tên mục có thể khác đôi chút tùy phiên bản hPanel.
2. Chọn **Import Git repository**, kết nối tài khoản GitHub, chọn repo `thanhnhaclaude/nha-shophoathanhnha`, nhánh `main`.
3. Cấu hình build:

   | Mục | Giá trị |
   |---|---|
   | Framework | Express (hoặc Other) |
   | Node.js version | 20.x hoặc 22.x |
   | Root directory | `/` |
   | Build command | `npm run build` |
   | Start command / Entry file | `npm start` / `server.js` |

4. Chọn tên miền **shophoathanhnha.com**.

## 2. Biến môi trường (Environment variables)

Nhập các biến này trong phần cài đặt ứng dụng. Danh sách đầy đủ có trong `.env.example`.

| Biến | Giá trị | Bắt buộc |
|---|---|---|
| `NODE_ENV` | `production` | ✅ |
| `SITE_URL` | `https://shophoathanhnha.com` | ✅ |
| `ADMIN_PASSWORD_HASH` | chạy `npm run hash-password -- "mật khẩu mạnh"` trên máy, dán kết quả vào đây | ✅ |
| `SESSION_SECRET` | chuỗi ngẫu nhiên dài, tạo bằng `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` | ✅ |
| `DATA_DIR` | thư mục **nằm ngoài** thư mục mã nguồn (xem mục 3) | ✅ |
| `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` | nhận báo đơn qua Telegram | tùy chọn |
| `SMTP_HOST=smtp.hostinger.com`, `SMTP_USER`, `SMTP_PASS`, `NOTIFY_EMAIL` | nhận báo đơn qua email | tùy chọn |

Hostinger tự cung cấp biến `PORT`, bạn không cần đặt.

## 3. Giữ dữ liệu khi deploy lại

Đơn hàng, sản phẩm sửa trong admin và ảnh tải lên được lưu dưới dạng file JSON trong `DATA_DIR`. Mỗi lần deploy, Hostinger có thể tạo lại thư mục mã nguồn, nên **phải đặt `DATA_DIR` ra ngoài thư mục mã nguồn**:

1. Mở **File Manager** và xem đường dẫn thư mục home của tài khoản (dạng `/home/u123456789/`).
2. Tạo thư mục `shop-data`.
3. Đặt `DATA_DIR=/home/u123456789/shop-data`.

Ở lần chạy đầu, ứng dụng tự chép dữ liệu mẫu từ `seed/` vào thư mục này. Hãy sao lưu thư mục này định kỳ. Hostinger có công cụ backup trong hPanel.

## 4. Tên miền và SSL

1. Trỏ DNS của shophoathanhnha.com về Hostinger. Nếu mua tên miền ở nơi khác, đổi nameserver sang `ns1.dns-parking.com` và `ns2.dns-parking.com`, hoặc dùng bản ghi A theo hướng dẫn trong hPanel.
2. Bật **SSL** (miễn phí) trong hPanel → SSL.
3. Ứng dụng tự chuyển `www` và `http` về `https://shophoathanhnha.com` khi `NODE_ENV=production`.

## 5. Sau khi website chạy

- [ ] Mở `https://shophoathanhnha.com/admin`, đăng nhập, vào **Cài đặt** và nhập tài khoản ngân hàng (VietQR), GA4 và mã xác minh Search Console.
- [ ] Đặt thử 1 đơn, kiểm tra thông báo Telegram/email, sau đó hủy đơn trong admin.
- [ ] Search Console: xác minh, gửi `https://shophoathanhnha.com/sitemap.xml`.
- [ ] Kiểm tra [Rich Results Test](https://search.google.com/test/rich-results) với một trang sản phẩm.
- [ ] Kiểm tra [PageSpeed Insights](https://pagespeed.web.dev/) trên di động.

## 6. Cập nhật website

Mỗi lần code được push lên nhánh `main` trên GitHub, Hostinger tự build và chạy lại. Nếu tự động deploy chưa bật, vào ứng dụng trong hPanel và bấm **Redeploy**.
