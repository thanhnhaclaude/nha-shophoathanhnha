// Kiểm tra nhanh: mọi trang chính trả về 200, đặt hàng và đăng nhập admin hoạt động.
// Chạy: npm run check  (dùng thư mục dữ liệu tạm, không đụng tới data/ thật)
const os = require('os');
const fs = require('fs');
const path = require('path');

process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'tn-smoke-'));
process.env.ADMIN_PASSWORD = 'smoke-test-password';
process.env.NODE_ENV = 'test';

const app = require('../server');
const server = app.listen(0);
const base = `http://127.0.0.1:${server.address().port}`;
let failed = 0;

async function expect(desc, url, opts = {}, status = 200, contains) {
  const res = await fetch(base + url, { redirect: 'manual', ...opts });
  const body = await res.text();
  const ok = res.status === status && (!contains || body.includes(contains));
  if (!ok) failed++;
  console.log(`${ok ? '✓' : '✗'} ${desc} (${res.status})`);
  return { res, body };
}

(async () => {
  const products = JSON.parse(fs.readFileSync(path.join(process.env.DATA_DIR, 'products.json'), 'utf8'));
  const p = products[0];
  await expect('Trang chủ', '/', {}, 200, 'application/ld+json');
  await expect('Danh mục', '/danh-muc/hoa-sinh-nhat', {}, 200, 'BreadcrumbList');
  await expect('Lọc giá (noindex)', '/danh-muc/hoa-sinh-nhat?gia=500k-1tr', {}, 200, 'noindex');
  await expect('Sản phẩm', `/san-pham/${p.slug}`, {}, 200, '"@type":"Product"');
  await expect('Tìm kiếm không dấu', '/tim-kiem?q=huong%20duong', {}, 200, 'hướng dương');
  await expect('Blog', '/blog', {}, 200);
  await expect('Bài viết', '/blog/cach-cham-soc-hoa-tuoi-lau', {}, 200, 'BlogPosting');
  for (const u of ['/gioi-thieu', '/lien-he', '/cau-hoi-thuong-gap', '/he-thong-cua-hang', '/chinh-sach/giao-hang', '/gio-hang', '/thanh-toan', '/tra-cuu-don-hang']) {
    await expect(u, u);
  }
  await expect('sitemap.xml', '/sitemap.xml', {}, 200, '<urlset');
  await expect('robots.txt', '/robots.txt', {}, 200, 'Sitemap:');
  await expect('llms.txt', '/llms.txt', {}, 200, '# Shop Hoa Thanh Nhã');
  await expect('404', '/khong-ton-tai', {}, 404);

  const cart = await fetch(`${base}/api/cart`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ items: [{ id: p.id, variant: 'Sang trọng', qty: 2 }] }),
  }).then((r) => r.json());
  const okCart = cart.lines.length === 1 && cart.total > 0;
  if (!okCart) failed++;
  console.log(`${okCart ? '✓' : '✗'} Tính giá giỏ hàng: ${cart.total}`);

  const tomorrow = new Date(Date.now() + 864e5).toISOString().slice(0, 10);
  const form = new URLSearchParams({
    cart: JSON.stringify([{ id: p.id, variant: 'Tiêu chuẩn', qty: 1 }]),
    senderName: 'Nguyễn Văn A',
    senderPhone: '0901234567',
    recipientName: 'Trần Thị B',
    recipientPhone: '0912345678',
    address: '1 Lê Lợi',
    district: 'Quận 1',
    city: 'TP. Hồ Chí Minh',
    deliveryDate: tomorrow,
    paymentMethod: 'bank',
  });
  await expect('Đặt hàng thiếu thông tin → 422', '/thanh-toan', { method: 'POST', body: new URLSearchParams({ cart: '[]' }) }, 422);
  const { res } = await expect('Đặt hàng hợp lệ → 303', '/thanh-toan', { method: 'POST', body: form }, 303);
  const loc = res.headers.get('location');
  await expect('Trang đơn hàng', loc, {}, 200, 'Cảm ơn bạn');
  await expect('Đơn hàng sai khóa → 404', loc.replace(/k=[^&]+/, 'k=sai'), {}, 404);

  await expect('Admin chưa đăng nhập → chuyển hướng', '/admin', {}, 302);
  await expect('Sai mật khẩu', '/admin/dang-nhap', { method: 'POST', body: new URLSearchParams({ password: 'x' }) }, 401);
  const login = await expect('Đăng nhập admin', '/admin/dang-nhap', { method: 'POST', body: new URLSearchParams({ password: 'smoke-test-password' }) }, 303);
  const cookie = login.res.headers.get('set-cookie').split(';')[0];
  for (const u of ['/admin', '/admin/don-hang', '/admin/san-pham', '/admin/san-pham/moi', `/admin/san-pham/${p.id}`, '/admin/bai-viet', '/admin/bai-viet/moi', '/admin/lien-he', '/admin/cai-dat']) {
    await expect(u, u, { headers: { cookie } });
  }
  await expect('POST admin thiếu CSRF → 403', '/admin/cai-dat', { method: 'POST', headers: { cookie }, body: new URLSearchParams({ announcement: 'x' }) }, 403);

  server.close();
  fs.rmSync(process.env.DATA_DIR, { recursive: true, force: true });
  console.log(failed ? `\n${failed} kiểm tra thất bại` : '\nTất cả kiểm tra đều đạt');
  process.exit(failed ? 1 : 0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
