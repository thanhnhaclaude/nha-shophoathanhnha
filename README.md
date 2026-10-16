# Shop Hoa Thanh Nhã — shophoathanhnha.com (Next.js + MySQL)

Website thương mại điện tử cho Shop hoa tươi Thanh Nhã, thay thế bản WordPress/WooCommerce hiện tại, giữ nguyên đường dẫn `/<slug>/` của danh mục và sản phẩm để không mất SEO.

**Công nghệ:** Next.js 16 (App Router) · React 19 · Tailwind CSS 4 · MySQL + Drizzle ORM · Node.js ≥ 20.9

## Tính năng

- Trang chủ, danh mục (lọc theo danh mục con, sắp xếp giá, phân trang), chi tiết sản phẩm, tìm kiếm
- Giỏ hàng (lưu trên trình duyệt), đặt hàng với ngày/giờ giao, lời nhắn thiệp & băng rôn
- Thanh toán **VietQR** (mã QR điền sẵn số tiền + mã đơn), tự xác nhận tiền về qua **SePay**, hoặc **COD**
- Email báo đơn mới / đã thanh toán cho shop và khách (SMTP Hostinger)
- Trang xác nhận đơn và tra cứu đơn theo mã + số điện thoại
- Trang quản trị `/admin`: tổng quan, quản lý đơn (trạng thái, thanh toán, ghi chú), quản lý sản phẩm (thêm/sửa/xóa, tải ảnh, gán danh mục)
- SEO: metadata từng trang, `sitemap.xml`, `robots.txt`, dữ liệu có cấu trúc Product (JSON-LD)
- Script nhập toàn bộ danh mục + sản phẩm từ WooCommerce hiện tại

## Chạy trên máy (Windows/macOS)

```bash
npm install
cp .env.example .env          # rồi điền các giá trị
npm run db:local              # (tùy chọn) MySQL tạm thời, giữ cửa sổ mở
npm run db:push               # tạo bảng
npm run import                # nhập sản phẩm từ hoathanhnha.com
npm run dev                   # http://localhost:3000
```

Tạo mật khẩu quản trị:

```bash
npm run hash-password -- "mat-khau-manh-cua-ban"
```

Dán dòng `ADMIN_PASSWORD_HASH="..."` vào `.env` (hoặc biến môi trường trên Hostinger).

## Biến môi trường

| Biến | Ý nghĩa |
|---|---|
| `DATABASE_URL` | `mysql://USER:PASS@HOST:3306/DBNAME` |
| `NEXT_PUBLIC_SITE_URL` | `https://shophoathanhnha.com` |
| `ADMIN_USERNAME` | Tên đăng nhập `/admin` |
| `ADMIN_PASSWORD_HASH` | Tạo bằng `npm run hash-password` |
| `AUTH_SECRET` | Chuỗi ngẫu nhiên ≥ 32 ký tự |
| `VIETQR_BANK_ID` | Mã ngân hàng: `VCB`, `TCB`, `MB`, `ACB`… |
| `VIETQR_ACCOUNT_NO` / `VIETQR_ACCOUNT_NAME` | Số và tên tài khoản nhận tiền |
| `SHIPPING_FEE` / `FREE_SHIPPING_THRESHOLD` | Phí giao và ngưỡng miễn phí (VND) |
| `ORDER_CODE_PREFIX` | Tiền tố mã đơn, website này dùng `TN`. Mỗi website chung tài khoản ngân hàng phải khác nhau |
| `SEPAY_API_KEY` | Khóa webhook SePay, tự đánh dấu đơn đã thanh toán (`/api/sepay/webhook/`) |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` | Hộp thư gửi email báo đơn (Hostinger: `smtp.hostinger.com`, 465) |
| `SHOP_EMAIL` | Hộp thư nhận thông báo đơn mới |
| `UPLOAD_DIR` | Thư mục lưu ảnh tải lên từ admin — nên đặt **ngoài** thư mục code |

## Deploy lên Hostinger (gói Business / Cloud có Node.js)

> Hướng dẫn chi tiết từng bước (kèm file dữ liệu và biến môi trường dựng sẵn): xem [HUONG-DAN-DEPLOY-HOSTINGER.md](HUONG-DAN-DEPLOY-HOSTINGER.md).

1. **Tạo database:** hPanel → *Databases → MySQL Databases* → tạo DB + user. Ghi lại tên DB, user, mật khẩu.
2. **Tạo bảng:** chọn một trong hai cách
   - *Remote MySQL* (hPanel → *Remote MySQL*, thêm IP máy bạn) rồi chạy trên máy: `DATABASE_URL=... npm run db:push` và `npm run import`.
   - Hoặc SSH vào hosting, vào thư mục app và chạy `npm run db:push && npm run import`.
3. **Đưa code lên GitHub**, sau đó hPanel → *Websites → Add website → Node.js Apps* → *Import Git repository* → chọn repo.
   - Build command: `npm run build` · Start command: `npm start` · Node.js: 22 (hoặc ≥ 20.9)
4. **Khai báo biến môi trường** trong phần *Environment variables* của app (các biến ở bảng trên). `DATABASE_URL` dùng host `localhost` khi DB cùng hosting.
5. **Ảnh tải lên:** đặt `UPLOAD_DIR=/home/<user>/uploads-hoathanhnha` để ảnh không bị xóa khi deploy lại.
6. Trỏ tên miền vào app, bật SSL.

### ⚠️ Trước khi chuyển tên miền

Ảnh sản phẩm hiện đang trỏ về `https://hoathanhnha.com/wp-content/uploads/...` (trên WordPress cũ). Khi tên miền chuyển sang website mới, các link này sẽ hỏng. Chọn một trong hai:

- Chạy `npm run import -- --download-images` để tải toàn bộ ảnh về `public/uploads/` rồi commit; **hoặc**
- Giữ WordPress cũ ở tên miền phụ (vd. `old.hoathanhnha.com`), đặt `IMPORT_SOURCE=https://old.hoathanhnha.com`, chạy lại `npm run import` và thêm tên miền phụ vào `images.remotePatterns` trong `next.config.ts`.

## Giữ nguyên SEO khi chuyển từ WordPress

- Mọi URL giữ nguyên như WordPress cũ, **có dấu `/` cuối** (`trailingSlash: true`).
- Sitemap giống cấu trúc Rank Math: `/sitemap_index.xml` → `post-`, `page-`, `product-`, `category-sitemap.xml` (cùng thứ tự, cùng lastmod). `/sitemap.xml` chuyển hướng về `/sitemap_index.xml`.
- Tiêu đề, meta description, robots (noindex) của từng URL được chép từ site cũ vào bảng `seo_meta`.
- Chuyển hướng 308: `/blocks/*` → trang chủ, `/<slug>/page/N/` → `/<slug>/?page=N`.
- Bài viết trùng slug với danh mục sản phẩm (vd. `/shop-hoa-tuoi-quan-10/`) hiển thị danh mục, như WordPress cũ.

Chạy lại khi website cũ vẫn còn online (trước khi chuyển tên miền):

```bash
npm run import                      # sản phẩm + danh mục + trang + bài viết + SEO
npm run import -- --content-only    # chỉ trang & bài viết
npm run import -- --seo-only        # chỉ tiêu đề/mô tả/robots/lastmod
```

Sau khi chuyển tên miền: gửi lại `https://hoathanhnha.com/sitemap_index.xml` trong Google Search Console.

## Cấu trúc thư mục

```
src/app/(shop)/      Website bán hàng (trang chủ, [slug], giỏ hàng, thanh toán, đơn hàng…)
src/app/admin/       Trang quản trị
src/components/      Header, footer, thẻ sản phẩm, giỏ hàng…
src/lib/db/          Schema MySQL (Drizzle) và kết nối
src/lib/menu.ts      Menu chính + các khối sản phẩm trang chủ
src/lib/site.ts      Hotline, Zalo, địa chỉ cửa hàng, khuyến mãi
src/lib/info-pages.ts Nội dung trang hướng dẫn/chính sách
scripts/             Nhập WooCommerce, MySQL tạm thời, tạo mật khẩu
design-system/       Quy chuẩn giao diện
```
