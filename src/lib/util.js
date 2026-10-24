const { marked } = require('marked');

const vnd = new Intl.NumberFormat('vi-VN');
const formatVND = (n) => `${vnd.format(Math.round(Number(n) || 0))}đ`;

// Bỏ dấu tiếng Việt để tạo đường dẫn thân thiện: "Hoa Hồng Đỏ" -> "hoa-hong-do".
function slugify(s) {
  return String(s || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const stripDiacritics = (s) => slugify(s).replace(/-/g, ' ');

function excerpt(text, len = 155) {
  const plain = String(text || '').replace(/[#*_>`\[\]()!-]/g, '').replace(/\s+/g, ' ').trim();
  return plain.length <= len ? plain : `${plain.slice(0, len - 1).replace(/\s+\S*$/, '')}…`;
}

const md = (src) => marked.parse(String(src || ''), { mangle: false, headerIds: false });

const finalPrice = (p) => (p.salePrice && p.salePrice < p.price ? p.salePrice : p.price);
const discountPct = (p) => (p.salePrice && p.salePrice < p.price ? Math.round((1 - p.salePrice / p.price) * 100) : 0);

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Asia/Ho_Chi_Minh' });
}

// Mã đơn ngắn, dễ đọc qua điện thoại: TN + 6 ký tự không gây nhầm lẫn.
function orderCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s = '';
  for (let i = 0; i < 6; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return `TN${s}`;
}

const todayVN = () => new Date(Date.now() + 7 * 3600e3).toISOString().slice(0, 10);

module.exports = { formatVND, slugify, stripDiacritics, excerpt, md, finalPrice, discountPct, formatDate, orderCode, todayVN };
