# shophoathanhnha.com (bản Express)

Bản Node.js/Express + EJS của shophoathanhnha.com, dữ liệu JSON trong `DATA_DIR`, VietQR/COD. Nằm ở nhánh `express-v2`; `main` là site Next.js đang chạy.

Build: `npm run check` · Nhánh làm việc: `express-v2` · Trả lời chủ shop bằng tiếng Việt.

## Luật cốt lõi
- Chỉ push lên `express-v2`. Không bao giờ push hay force-push lên `main` khi chủ shop chưa đồng ý rõ ràng.
- Cùng thương hiệu với hoathanhnha.com: nội dung viết riêng, không chép, không trỏ link qua lại để đẩy hạng.
- Kế hoạch SEO: `docs/KE-HOACH-SEO.md`.

## Luồng làm việc
Mỗi việc một session ngắn, mở bằng lệnh luồng: `/cua-hang`, `/seo`. Bảng phạm vi: `docs/luong/README.md`.
- Chỉ sửa file thuộc luồng mình. Việc của luồng khác: ghi sang sổ luồng đó với tiền tố `[từ <luồng>]`.
- Quên mở bằng lệnh luồng: hỏi chủ shop việc này thuộc luồng nào. Việc vặt 1 dòng thì làm thẳng, không cần đọc sổ.
- Sổ `docs/luong/<luồng>.md` có đúng 4 mục, giữ dưới 120 dòng. Quyết định đã chốt không được làm ngược khi chủ shop chưa đồng ý.

## Ship
- Xong mỗi việc: `npm run check` không lỗi, rồi trong CÙNG commit ghi sổ luồng: thêm 1 dòng Nhật ký (mới nhất ở trên); cập nhật Trạng thái, Quyết định đã chốt, Việc cần làm tiếp; sửa CLAUDE.md nếu thay đổi làm nó sai.
- Nhật ký quá 30 dòng: dời phần cũ sang `docs/luong/luu-tru/<luồng>-YYYY-MM.md`.
- Push lên `express-v2`. Bị từ chối: `git pull --rebase` rồi push lại. Không bao giờ `push --force`.
- Kết thúc bằng đúng 1 dòng: "Đã push + đã ghi sổ <luồng>. Có thể đóng luồng."
- `/xong` chỉ dùng khi việc bị dừng giữa chừng chưa push.
