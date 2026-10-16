# Hướng dẫn deploy shophoathanhnha.com lên Hostinger

Áp dụng cho gói **Business / Cloud** có mục **Node.js** trong hPanel.

Trên máy bạn, thư mục `deploy/` (không có trên GitHub) chứa sẵn:

| File | Dùng để |
|---|---|
| `deploy/hostinger-env.txt` | Toàn bộ biến môi trường. Khóa bí mật và mật khẩu admin đã được tạo sẵn |
| `deploy/database.sql.gz` | Toàn bộ dữ liệu: 743 sản phẩm, 162 danh mục, 228 bài viết, 11 trang, SEO 1144 URL |

---

## Bước 1: Tạo database MySQL

1. hPanel → **Databases → MySQL Databases**.
2. Tạo database mới và user mới. Đặt mật khẩu **chỉ gồm chữ và số** để không phải mã hóa ký tự đặc biệt.
3. Ghi lại *tên database*, *user*, *mật khẩu*.
4. Mở `deploy/hostinger.env` và điền 3 dòng `DB_USER`, `DB_PASSWORD`, `DB_NAME` (giữ `DB_HOST=localhost`, `DB_PORT=3306`). Không cần `DATABASE_URL`.
   - Kiểm tra kết nối sau khi deploy: mở `https://shophoathanhnha.com/api/health/` → `"status":"ok"`.

## Bước 2: Nhập dữ liệu

1. hPanel → **Databases → phpMyAdmin**, rồi chọn database vừa tạo.
2. Chọn tab **Import**, chọn file `deploy/database.sql.gz` và bấm **Import** (hoặc **Go**).
3. Kiểm tra: phải có 9 bảng, trong đó `products` có 743 dòng.

## Bước 3: Tạo ứng dụng Node.js từ GitHub

1. hPanel → **Websites → Add website → Node.js Apps** (hoặc mở website shophoathanhnha.com → **Node.js**).
2. Chọn **Import Git repository** và đăng nhập GitHub khi được hỏi. Chọn repo `thanhnhaclaude/nha-shophoathanhnha`, nhánh `main`.
3. Cấu hình:
   - **Node.js version:** 22.x (tối thiểu 20.9)
   - **Build command:** `npm run build`
   - **Start command:** `npm start`
   - **Output / root directory:** để mặc định (thư mục gốc repo)

## Bước 4: Khai báo biến môi trường (trước khi bấm Deploy)

Trong phần **Environment variables** của ứng dụng, thêm **từng dòng** trong `deploy/hostinger-env.txt`, gồm tên biến và giá trị:

- Bắt buộc phải điền: `DATABASE_URL`, `VIETQR_BANK_ID`, `VIETQR_ACCOUNT_NO`, `VIETQR_ACCOUNT_NAME`, `UPLOAD_DIR` (thay `<user>`).
- Đã có sẵn, chỉ cần dán: `NEXT_PUBLIC_SITE_URL`, `ADMIN_USERNAME`, `ADMIN_PASSWORD_HASH`, `AUTH_SECRET`, `SHIPPING_FEE`, `FREE_SHIPPING_THRESHOLD`.
- `NEXT_PUBLIC_SITE_URL` được ghi vào lúc build. Nếu đổi giá trị này thì phải **Deploy lại**.

## Bước 5: Deploy và gắn tên miền

1. Bấm **Deploy**. Lần đầu mất vài phút, vì repo có khoảng 360 MB ảnh.
2. Trỏ tên miền **shophoathanhnha.com** về ứng dụng này và bật **SSL** (hPanel → **Security → SSL**).
3. Tạo thư mục ảnh tải lên (đúng giá trị `UPLOAD_DIR`) bằng **File Manager**, ví dụ `/home/<user>/uploads-shophoathanhnha`.

## Bước 6: Kiểm tra sau khi chạy

- [ ] https://shophoathanhnha.com/ hiển thị trang chủ có ảnh
- [ ] https://shophoathanhnha.com/hoa-bo/ hiển thị danh mục
- [ ] https://shophoathanhnha.com/sitemap_index.xml có 4 sitemap
- [ ] https://shophoathanhnha.com/admin/ đăng nhập được: user `admin`, mật khẩu ghi trong `deploy/hostinger-env.txt`
- [ ] Đặt thử một đơn VietQR: mã QR hiện đúng số tài khoản
- [ ] Trang quản trị → Sản phẩm → sửa một sản phẩm → **Tải ảnh lên** chạy được

## Bước 7: Tự xác nhận chuyển khoản (SePay)

1. Đăng ký tại https://my.sepay.vn, liên kết tài khoản **VCB 1066354898**.
2. **Webhooks → Thêm webhook**:
   - Sự kiện: *Có tiền vào* · URL: `https://shophoathanhnha.com/api/sepay/webhook/` (**có dấu `/` cuối**)
   - Kiểu chứng thực: **API Key**. Tạo một chuỗi ngẫu nhiên, dán vào SePay và vào biến `SEPAY_API_KEY` trên Hostinger.
3. Mã đơn của website này bắt đầu bằng **TN** (`ORDER_CODE_PREFIX=TN`). Website khác dùng chung tài khoản VCB phải có tiền tố khác và webhook riêng, để không xác nhận nhầm đơn của nhau.
4. Đặt thử một đơn VietQR nhỏ và chuyển khoản: trong vài giây trang đơn hàng tự chuyển sang **Đã thanh toán**, đơn trong admin sang **Đã xác nhận**.
   - Chuyển thiếu tiền: đơn giữ *Chưa thanh toán*, ghi chú admin ghi rõ số tiền đã nhận.

## Bước 8: Email báo đơn

1. hPanel → **Emails** → tạo hộp thư, ví dụ `donhang@shophoathanhnha.com`.
2. Khai báo `SMTP_HOST=smtp.hostinger.com`, `SMTP_PORT=465`, `SMTP_USER=donhang@shophoathanhnha.com`, `SMTP_PASS=<mật khẩu hộp thư>`, `SHOP_EMAIL=<hộp thư nhận thông báo>`.
3. Mỗi đơn mới: shop nhận email báo đơn, khách (nếu nhập email) nhận email xác nhận. Khi SePay báo tiền về, cả hai nhận thêm email “Đã thanh toán”.
4. Kiểm tra `https://shophoathanhnha.com/api/health/`: các mục `SMTP_*` và `SEPAY_API_KEY` phải là `true`.

## Bước 9: Google

1. Thêm **shophoathanhnha.com** vào Google Search Console và gửi sitemap `https://shophoathanhnha.com/sitemap_index.xml`.
2. Lưu ý: hoathanhnha.com và shophoathanhnha.com có cùng sản phẩm và bài viết. Google thường chỉ xếp hạng một trong hai bản trùng nội dung, nên nên viết lại dần bài viết/mô tả cho một trong hai website.

---

## Cập nhật website về sau

- Sửa code rồi push lên nhánh `main`. Trong hPanel bấm **Deploy** lại, hoặc bật tự deploy khi có commit mới.
- Thay đổi cấu trúc bảng (hiếm khi cần): chạy `npm run db:push` với `DATABASE_URL` của Hostinger, qua SSH hoặc Remote MySQL.
- Sao lưu dữ liệu: dùng phpMyAdmin → **Export**, hoặc chạy `npm run export-sql` khi kết nối tới database Hostinger.
