// Tính tiền, tạo đơn và tra cứu đơn hàng.
const crypto = require('crypto');
const store = require('./store');
const site = require('../config/site');
const catalog = require('./catalog');
const { finalPrice, orderCode } = require('./util');

const STATUS = {
  new: 'Mới đặt',
  confirmed: 'Đã xác nhận',
  preparing: 'Đang cắm hoa',
  delivering: 'Đang giao',
  done: 'Đã giao',
  cancelled: 'Đã hủy',
};
const PAYMENT_STATUS = { unpaid: 'Chưa thanh toán', paid: 'Đã thanh toán' };

const cleanPhone = (s) => String(s || '').replace(/[\s.\-()]/g, '').replace(/^\+84/, '0');
const validPhone = (s) => /^0\d{9,10}$/.test(cleanPhone(s));

// Giá luôn tính lại từ dữ liệu máy chủ, không tin giá gửi lên từ trình duyệt.
function priceCart(rawItems) {
  const lines = [];
  for (const it of Array.isArray(rawItems) ? rawItems.slice(0, 30) : []) {
    const p = catalog.productById(String(it.id));
    if (!p || p.inStock === false) continue;
    const variant = catalog.variants(p).find((v) => v.name === it.variant) || catalog.variants(p)[0];
    const qty = Math.min(Math.max(parseInt(it.qty, 10) || 1, 1), 50);
    lines.push({
      productId: p.id,
      slug: p.slug,
      name: p.name,
      image: p.images[0],
      variant: variant.name,
      price: finalPrice(p) + (variant.add || 0),
      qty,
    });
  }
  const subtotal = lines.reduce((s, l) => s + l.price * l.qty, 0);
  const shipping = subtotal === 0 || subtotal >= site.freeShipFrom ? 0 : site.shippingFee;
  return { lines, subtotal, shipping, total: subtotal + shipping };
}

function validate(body) {
  const errors = {};
  const need = (key, label) => {
    if (!String(body[key] || '').trim()) errors[key] = `Vui lòng nhập ${label}`;
  };
  need('senderName', 'họ tên người gửi');
  need('recipientName', 'họ tên người nhận');
  need('address', 'địa chỉ giao hoa');
  need('city', 'tỉnh/thành phố');
  need('deliveryDate', 'ngày giao');
  if (!validPhone(body.senderPhone)) errors.senderPhone = 'Số điện thoại người gửi chưa đúng (10–11 số)';
  if (!validPhone(body.recipientPhone)) errors.recipientPhone = 'Số điện thoại người nhận chưa đúng (10–11 số)';
  if (body.senderEmail && !/^\S+@\S+\.\S+$/.test(body.senderEmail)) errors.senderEmail = 'Email chưa đúng định dạng';
  if (body.deliveryDate && body.deliveryDate < new Date(Date.now() + 7 * 3600e3).toISOString().slice(0, 10)) {
    errors.deliveryDate = 'Ngày giao không được ở quá khứ';
  }
  return errors;
}

const cut = (s, n) => String(s || '').trim().slice(0, n);

function create(body, cart) {
  let code;
  do code = orderCode();
  while (store.find('orders', (o) => o.code === code));
  return store.insert('orders', {
    code,
    accessKey: crypto.randomBytes(12).toString('base64url'),
    items: cart.lines,
    subtotal: cart.subtotal,
    shipping: cart.shipping,
    total: cart.total,
    sender: { name: cut(body.senderName, 80), phone: cleanPhone(body.senderPhone), email: cut(body.senderEmail, 120) },
    recipient: {
      name: cut(body.recipientName, 80),
      phone: cleanPhone(body.recipientPhone),
      address: cut(body.address, 200),
      district: cut(body.district, 80),
      city: cut(body.city, 80),
    },
    delivery: { date: cut(body.deliveryDate, 10), slot: cut(body.deliverySlot, 20) || 'Càng sớm càng tốt' },
    cardMessage: cut(body.cardMessage, 300),
    note: cut(body.note, 500),
    surprise: body.surprise === 'on',
    paymentMethod: body.paymentMethod === 'cod' ? 'cod' : 'bank',
    status: 'new',
    paymentStatus: 'unpaid',
  });
}

function bankInfo() {
  const s = store.getSettings().bank || {};
  return {
    bin: s.bin || site.bank.bin,
    account: s.account || site.bank.account,
    name: s.name || site.bank.name,
    bankName: s.bankName || site.bank.bankName,
  };
}

function vietQrUrl(order) {
  const b = bankInfo();
  if (!b.bin || !b.account) return null;
  const q = new URLSearchParams({ amount: String(order.total), addInfo: order.code, accountName: b.name });
  return `https://img.vietqr.io/image/${encodeURIComponent(b.bin)}-${encodeURIComponent(b.account)}-compact2.png?${q}`;
}

const byCode = (code) => store.find('orders', (o) => o.code === String(code || '').toUpperCase());

module.exports = { STATUS, PAYMENT_STATUS, priceCart, validate, create, vietQrUrl, bankInfo, byCode, cleanPhone, validPhone };
