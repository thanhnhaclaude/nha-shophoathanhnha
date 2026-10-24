# Kế hoạch SEO – shophoathanhnha.com

Bản 24/10/2026 · Áp dụng cho website Node.js trong repo này.

**Nguồn tham chiếu**

1. [Cẩm nang SEO cơ bản của Google](https://developers.google.com/search/docs/fundamentals/seo-starter-guide?hl=vi): giúp Google tìm thấy, hiểu và hiển thị trang tốt; nội dung hữu ích viết cho người đọc.
2. [Marketing Skills (coreyhaines31/marketingskills)](https://github.com/coreyhaines31/marketingskills): các kỹ năng `seo-audit`, `site-architecture`, `schema`, `content-strategy`, `programmatic-seo`, `ai-seo`, `copywriting`, `cro`, `analytics`.

Ký hiệu trong kế hoạch: **[Claude]** là việc Claude làm trong code hoặc nội dung. **[Shop]** là việc cần chủ shop làm, vì cần đăng nhập tài khoản hoặc cần ảnh thật.

---

## 0. Quyết định chiến lược trước tiên: hai tên miền cùng một thương hiệu

Shop đang có **hoathanhnha.com**, website chính đã có thứ hạng. Bây giờ thêm **shophoathanhnha.com**. Nếu hai site cùng thương hiệu, cùng sản phẩm và cùng nội dung, Google sẽ coi là trùng lặp. Hai site sẽ tranh từ khóa của nhau, và thường chỉ một site được hiển thị.

**Khuyến nghị:**

| Phương án | Khi nào chọn | Cách làm |
|---|---|---|
| **A. Site bán hàng riêng (mặc định trong repo)** | Muốn có thêm một kênh bán online | Nội dung **viết mới 100%**: mô tả sản phẩm, danh mục và blog khác hoathanhnha.com. Nhắm cụm từ khóa "shop hoa", "đặt hoa online", "bó hoa giá…" và theo ngân sách. Không sao chép bài viết giữa hai site. |
| B. Gộp về một site | Không đủ nguồn lực viết nội dung cho cả hai site | Chuyển hướng 301 toàn bộ shophoathanhnha.com về hoathanhnha.com. |

Dù chọn phương án nào: **chỉ dùng một Google Business Profile** cho mỗi địa chỉ cửa hàng (Google không cho phép hai hồ sơ cùng một địa điểm). Trang web trên hồ sơ trỏ về site chính.

Toàn bộ nội dung mẫu trong repo này (18 sản phẩm, 8 danh mục, 6 bài blog) đã được viết mới, không lấy từ hoathanhnha.com.

---

## 1. Nền tảng kỹ thuật (theo phần "Giúp Google tìm thấy nội dung" của Cẩm nang)

| Hạng mục | Trạng thái | Ghi chú |
|---|---|---|
| Render phía máy chủ (HTML có sẵn nội dung) | ✅ Đã làm | Express + EJS, Google đọc được ngay mà không cần chạy JS |
| `sitemap.xml` có ảnh, cập nhật tự động | ✅ | `/sitemap.xml` sinh từ dữ liệu, có `image:image` |
| `robots.txt` | ✅ | Chặn `/admin`, giỏ hàng, thanh toán, đơn hàng, tìm kiếm |
| URL mô tả, không dấu, có từ khóa | ✅ | `/danh-muc/hoa-sinh-nhat`, `/san-pham/bo-hoa-hong-pastel-diu-dang` |
| Thẻ canonical mọi trang | ✅ | Bỏ tham số truy vấn; trang lọc giá đặt `noindex, follow` |
| Một phiên bản URL (https, không www) | ✅ | Chuyển hướng 301 khi `NODE_ENV=production` |
| Breadcrumb hiển thị + dữ liệu có cấu trúc | ✅ | `BreadcrumbList` |
| Trang 404 hữu ích | ✅ | Trả mã 404 thật, có link danh mục |
| Tốc độ: ảnh WebP, kích thước khai báo, lazy-load, preload ảnh LCP, nén gzip, cache 1 năm cho ảnh | ✅ | Kiểm tra lại bằng PageSpeed sau khi deploy |
| Thân thiện di động | ✅ | Mobile-first, thanh mua hàng cố định ở trang sản phẩm |
| `llms.txt` cho trợ lý AI | ✅ | `/llms.txt` (kỹ năng `ai-seo`) |
| Xác minh Search Console + gửi sitemap | ⏳ **[Shop]** | Dán mã xác minh ở Admin > Cài đặt, gửi `https://shophoathanhnha.com/sitemap.xml` |
| GA4 | ⏳ **[Shop]** | Tạo Measurement ID, dán ở Admin > Cài đặt |
| Bing Webmaster Tools | ⏳ **[Shop]** | Nhập dữ liệu từ Search Console (1 cú nhấp) |

## 2. Dữ liệu có cấu trúc (kỹ năng `schema`)

Đã có trong code (`src/lib/seo.js`):

- `Florist` (LocalBusiness): tên, địa chỉ, giờ mở cửa, điện thoại, `sameAs` mạng xã hội. Có ở trang chủ, giới thiệu, liên hệ, cửa hàng.
- `WebSite` + `SearchAction` (ô tìm kiếm trong kết quả tìm kiếm).
- `Product` + `Offer`: giá VND, tình trạng còn hàng, phí giao, chính sách đổi trả. Đây là điều kiện để có kết quả sản phẩm và Merchant listings.
- `ItemList` cho trang danh mục, `BlogPosting` cho bài viết, `FAQPage` cho các trang hỏi đáp.

**Cố ý không thêm:** `AggregateRating` hay `Review` khi chưa có đánh giá thật. Google xử phạt đánh giá bịa.

- **[Shop]** Sau khi có đánh giá Google hoặc đánh giá từ khách trên web, **[Claude]** sẽ thêm khối đánh giá thật.
- **[Claude]** Kiểm tra bằng [Rich Results Test](https://search.google.com/test/rich-results) sau khi deploy.

## 3. Kiến trúc site và bản đồ từ khóa (kỹ năng `site-architecture`)

Mỗi trang nhắm **một chủ đề chính**. Không để hai trang tranh cùng một từ khóa.

| Trang | Từ khóa chính | Từ khóa phụ / ý định |
|---|---|---|
| Trang chủ `/` | shop hoa tươi, shop hoa thanh nhã | đặt hoa online, giao hoa tận nơi |
| `/danh-muc/hoa-sinh-nhat` | hoa sinh nhật | hoa sinh nhật tặng mẹ / người yêu / bạn |
| `/danh-muc/hoa-tinh-yeu` | hoa tặng người yêu | hoa hồng đỏ, hoa valentine, hoa kỷ niệm |
| `/danh-muc/hoa-khai-truong` | hoa khai trương | kệ hoa khai trương, hoa chúc mừng khai trương |
| `/danh-muc/hoa-chuc-mung` | hoa chúc mừng | hoa tốt nghiệp, hoa thăng chức, hoa 20/11 |
| `/danh-muc/hoa-cuoi` | hoa cưới cầm tay | hoa cô dâu, hoa cưới đẹp |
| `/danh-muc/hoa-chia-buon` | hoa chia buồn | vòng hoa tang lễ, kệ hoa viếng |
| `/danh-muc/lan-ho-diep` | lan hồ điệp | chậu lan hồ điệp, lan hồ điệp tặng sếp |
| `/danh-muc/bo-hoa-tuoi` | bó hoa tươi | bó hoa đẹp, bó hoa giá rẻ |
| `/he-thong-cua-hang` | shop hoa gần đây | địa chỉ shop hoa + quận |
| Blog | câu hỏi thông tin | ý nghĩa hoa…, cách chăm sóc hoa… |

**[Shop]** Gửi file từ khóa hoặc dữ liệu Search Console của hoathanhnha.com. **[Claude]** sẽ điều chỉnh bảng trên theo dữ liệu thật (lượt hiển thị, vị trí) thay vì phỏng đoán.

**Liên kết nội bộ.** Trang chủ trỏ đến 8 danh mục. Danh mục trỏ đến sản phẩm. Sản phẩm trỏ đến sản phẩm liên quan. Mỗi bài blog có ít nhất 2 link tới danh mục hoặc sản phẩm, với anchor text mô tả rõ (như Cẩm nang khuyên: tránh "bấm vào đây").

## 4. Nội dung trên trang (Cẩm nang: "Tạo nội dung hữu ích, đáng tin cậy, lấy con người làm trọng tâm")

Đã áp dụng:

- Thẻ `<title>` riêng cho từng trang, dạng "Từ khóa – lợi ích | Shop Hoa Thanh Nhã".
- Meta description riêng, dưới 160 ký tự.
- Một thẻ H1 mỗi trang.
- Trang danh mục có đoạn giới thiệu ở đầu, phần nội dung hướng dẫn chọn hoa ở cuối và FAQ riêng. Nhờ vậy danh mục không chỉ là một lưới sản phẩm "mỏng".
- Mô tả sản phẩm viết riêng: kích thước, thành phần hoa, dịp phù hợp, lưu ý theo mùa.
- Ảnh có `alt` mô tả, tên file không dấu có từ khóa (`bo-hoa-hong-pastel.webp`), đặt gần đoạn văn liên quan.

Việc tiếp theo:

- **[Shop]** Thay ảnh minh họa Unsplash bằng **ảnh thật của shop**: ảnh dọc 4:5, tối thiểu 1200px. Đây là yếu tố E-E-A-T (kinh nghiệm thực tế) quan trọng nhất cho shop hoa. Ảnh tải lên qua Admin > Sản phẩm.
- **[Shop]** Cung cấp thông tin thật cho trang Giới thiệu: năm thành lập, tên và ảnh florist, giấy phép kinh doanh. **[Claude]** sẽ viết lại trang theo các thông tin này.
- **[Claude]** Mở rộng mỗi danh mục lên 12–20 sản phẩm. Các mức giá phổ biến cần có sản phẩm tương ứng.

## 5. Lịch nội dung blog (kỹ năng `content-strategy`)

Tần suất 2 bài mỗi tuần. Ưu tiên câu hỏi có ý định mua gần, và các dịp lễ (đăng trước 4–6 tuần).

| Tuần | Chủ đề | Link nội bộ tới |
|---|---|---|
| 1 | Hoa tặng 20/11 cho thầy cô: chọn gì, giá bao nhiêu | Hoa chúc mừng |
| 1 | Ý nghĩa hoa hướng dương và dịp nên tặng | Bó hướng dương |
| 2 | Hoa sinh nhật cho mẹ: 10 mẫu theo độ tuổi | Hoa sinh nhật |
| 2 | Kệ hoa khai trương bao nhiêu tiền? Bảng giá theo kích thước | Hoa khai trương |
| 3 | Lời chúc khai trương hay, ngắn gọn để in băng rôn | Hoa khai trương |
| 3 | Câu chia buồn trang trọng ghi trên vòng hoa | Hoa chia buồn |
| 4 | Hoa Giáng sinh và hoa tặng dịp cuối năm | Bó hoa tươi |
| 4 | Chăm sóc lan hồ điệp để hoa nở lâu | Lan hồ điệp |
| 5–6 | Hoa Tết: lan, mai, đào. Gợi ý quà Tết cho doanh nghiệp | Lan hồ điệp |
| 7–8 | Valentine 14/2: ý nghĩa số bông hồng, mẫu theo ngân sách | Hoa tình yêu |
| 9–12 | 8/3, mùa cưới, tốt nghiệp; cập nhật lại các bài cũ | theo dịp |

Mỗi bài cần có:

- Câu trả lời trực tiếp ngay trong đoạn đầu (dễ được trích dẫn trong AI Overviews).
- Bảng hoặc danh sách.
- Ảnh thật.
- Ngày cập nhật.
- Lời kêu gọi đặt hoa có link tới danh mục.

## 6. SEO địa phương

- **[Shop]** Cập nhật Google Business Profile cho từng cửa hàng: danh mục "Cửa hàng hoa", giờ mở cửa, ảnh thật mỗi tuần, đăng bài theo dịp lễ, trả lời mọi đánh giá.
- **[Shop]** Xin đánh giá Google sau mỗi đơn giao thành công. Có thể đặt mã QR dẫn tới trang đánh giá lên thiệp.
- **[Claude]** Đảm bảo NAP (tên, địa chỉ, số điện thoại) giống hệt nhau trên website, GBP và mạng xã hội.
- **[Claude]** Sau khi có dữ liệu thật, tạo trang riêng cho từng cửa hàng (`/cua-hang/quan-1`…). Mỗi trang cần nội dung riêng: ảnh cửa hàng, chỉ đường, khu vực giao, mẫu bán chạy tại khu vực đó. **Không** sinh hàng loạt trang quận chỉ thay tên (kỹ năng `programmatic-seo` cảnh báo đây là "doorway page", sẽ bị Google hạ hạng).

## 7. Liên kết từ bên ngoài

Cẩm nang Google cũng nói rõ rằng việc được nhắc đến tự nhiên quan trọng hơn mua liên kết.

- **[Shop]** Hợp tác với wedding planner, nhà hàng tiệc cưới, studio ảnh cưới (đặt link "đối tác hoa").
- **[Shop]** Đăng ký Foody, Google Maps, các danh bạ doanh nghiệp địa phương uy tín.
- **[Claude]** Soạn sẵn bài PR hoặc bài khách mời về chủ đề hoa theo mùa.
- **Không** mua backlink hàng loạt.

## 8. Tối ưu chuyển đổi (kỹ năng `cro`), vì traffic chỉ có giá trị khi khách đặt hàng

Đã có:

- Nút gọi điện và Zalo nổi trên mọi trang.
- Thanh mua hàng cố định trên di động.
- Cam kết đổi trả, giao 1–3 giờ và gửi ảnh trước khi giao ngay cạnh nút mua.
- Thanh tiến độ "mua thêm X để miễn phí giao".
- Form đặt hàng 4 bước rõ ràng, báo lỗi cạnh từng ô.
- Mã VietQR có sẵn số tiền.

Việc tiếp theo, mỗi việc test 2–4 tuần: tiêu đề hero, thứ tự danh mục, hiển thị "Giao trong hôm nay nếu đặt trước 18:00".

## 9. Đo lường (kỹ năng `analytics`)

| Chỉ số | Công cụ | Mục tiêu 12 tuần |
|---|---|---|
| Số trang được lập chỉ mục | Search Console > Trang | ≥ 95% số URL trong sitemap |
| Lượt hiển thị / nhấp tự nhiên | Search Console > Hiệu suất | Tăng đều mỗi tháng; đặt mốc sau 4 tuần đầu |
| Số từ khóa top 10 | Search Console | Đo mốc tuần 4, so sánh tuần 12 |
| Core Web Vitals (LCP < 2,5s, CLS < 0,1, INP < 200ms) | PageSpeed / CrUX | Đạt "Tốt" trên di động |
| Tỷ lệ đặt hàng | GA4 + số đơn trong Admin | Theo dõi hằng tuần |
| Cuộc gọi, nhắn Zalo, đơn hàng | GA4: sự kiện `click_call`, `click_zalo`, `purchase` (đã gắn sẵn) | Đánh dấu `purchase` là sự kiện chính (key event) trong GA4 |

## 10. Lộ trình 12 tuần

| Tuần | Việc chính |
|---|---|
| 1 | **[Shop]** Deploy Hostinger, trỏ tên miền, bật SSL. Xác minh Search Console, gửi sitemap, bật GA4. **[Claude]** Kiểm tra Rich Results và PageSpeed, sửa lỗi phát sinh. |
| 2 | **[Shop]** Chọn phương án A/B ở mục 0, gửi ảnh thật đợt 1 (8 sản phẩm bán chạy). **[Claude]** Cập nhật ảnh, viết 2 bài blog tuần 1. |
| 3–4 | **[Claude]** Thêm 30 sản phẩm mới có mô tả riêng, 4 bài blog. **[Shop]** Cập nhật GBP và bắt đầu xin đánh giá. |
| 5–6 | **[Claude]** Đo mốc Search Console, chỉnh title/description các trang có hiển thị cao nhưng CTR thấp. Đăng nội dung Tết. |
| 7–8 | **[Claude]** Trang cửa hàng riêng (nếu đủ dữ liệu thật), nội dung Valentine. **[Shop]** Liên hệ 5 đối tác cưới. |
| 9–10 | **[Claude]** Cập nhật bài cũ, thêm FAQ từ câu hỏi thật của khách, gắn sự kiện GA4. |
| 11–12 | **[Claude]** Báo cáo so sánh với mốc, lập kế hoạch quý tiếp theo. |

---

### Việc chủ shop cần làm ngay

1. Deploy theo [HUONG-DAN-DEPLOY-HOSTINGER.md](HUONG-DAN-DEPLOY-HOSTINGER.md).
2. Chọn phương án tên miền ở mục 0.
3. Nhập tài khoản ngân hàng ở Admin > Cài đặt để mã VietQR hoạt động.
4. Gửi ảnh thật của sản phẩm và cửa hàng.
