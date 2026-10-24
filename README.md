# Shop Hoa Thanh Nhã – shophoathanhnha.com

Website bán hoa tươi viết bằng **Node.js + Express + EJS**: render phía máy chủ, chuẩn SEO, không cần cơ sở dữ liệu.

## Tính năng

- **Cửa hàng:**
  - Trang chủ, 8 danh mục theo dịp, lọc theo giá và sắp xếp.
  - Trang sản phẩm có bản Tiêu chuẩn và Sang trọng.
  - Tìm kiếm tiếng Việt không dấu.
- **Đặt hàng:**
  - Giỏ hàng, form 4 bước gồm người gửi, người nhận, ngày và khung giờ giao, lời nhắn thiệp, tặng bất ngờ.
  - Thanh toán **VietQR** (mã QR có sẵn số tiền) hoặc **COD**.
  - Tra cứu đơn hàng. Báo đơn mới qua Telegram và/hoặc email.
- **Quản trị** `/admin`: đơn hàng (trạng thái, thanh toán), sản phẩm (tải ảnh), bài viết blog (Markdown), tin liên hệ, cài đặt (ngân hàng, GA4, Search Console).
- **SEO:**
  - Title, meta description và canonical riêng cho từng trang. Open Graph.
  - `sitemap.xml` có ảnh, `robots.txt`, `llms.txt`.
  - Dữ liệu có cấu trúc: Florist, WebSite, Product/Offer, BreadcrumbList, ItemList, BlogPosting, FAQPage.
  - Sự kiện GA4 `purchase`, `click_call`, `click_zalo`.
- **Hiệu năng và truy cập:** ảnh WebP có kích thước khai báo, lazy-load, nén gzip, cache dài hạn. Hỗ trợ bàn phím, `prefers-reduced-motion`, nút bấm tối thiểu 44px.

Kế hoạch SEO 12 tuần nằm ở [docs/KE-HOACH-SEO.md](docs/KE-HOACH-SEO.md). Hướng dẫn deploy nằm ở [docs/HUONG-DAN-DEPLOY-HOSTINGER.md](docs/HUONG-DAN-DEPLOY-HOSTINGER.md).

## Chạy trên máy

```bash
npm install
cp .env.example .env   # rồi đặt ADMIN_PASSWORD
npm run dev            # http://localhost:3000
npm run check          # chạy kiểm tra tự động (37 kiểm tra)
```

## Cấu trúc

```
server.js              Điểm khởi động (Hostinger entry file)
src/config/site.js     Thông tin shop: tên, hotline, cửa hàng, phí ship
src/lib/               store (JSON), catalog, orders, seo, auth, notify
src/routes/            shop.js (trang công khai), admin.js, seo.js (sitemap/robots/llms)
src/content/           Trang chính sách, FAQ
views/                 Giao diện EJS (views/admin cho trang quản trị)
public/                CSS, JS, ảnh, favicon
seed/                  Dữ liệu mẫu, chép vào DATA_DIR ở lần chạy đầu
design-system/         Design system (màu, chữ, nguyên tắc UI)
```

## Ảnh

Ảnh minh họa lấy từ [Unsplash](https://unsplash.com/license): miễn phí cho mục đích thương mại, không cần ghi nguồn. Danh sách ảnh và mã ảnh gốc nằm ở `public/images/CREDITS.txt`. Website **không dùng ảnh của website khác**. Nên thay dần bằng ảnh thật của shop qua trang admin.
