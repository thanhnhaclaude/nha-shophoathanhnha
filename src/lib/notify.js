// Báo đơn hàng mới cho shop qua Telegram và/hoặc email. Bỏ qua nếu chưa cấu hình.
const nodemailer = require('nodemailer');
const site = require('../config/site');
const { formatVND } = require('./util');

function orderText(o) {
  const lines = o.items.map((i) => `• ${i.name} (${i.variant}) x${i.qty} = ${formatVND(i.price * i.qty)}`);
  return [
    `🌸 ĐƠN MỚI ${o.code} – ${formatVND(o.total)}`,
    ...lines,
    `Người gửi: ${o.sender.name} – ${o.sender.phone}`,
    `Người nhận: ${o.recipient.name} – ${o.recipient.phone}`,
    `Địa chỉ: ${o.recipient.address}, ${o.recipient.district}, ${o.recipient.city}`,
    `Giao: ${o.delivery.date} ${o.delivery.slot}`,
    o.cardMessage ? `Thiệp: ${o.cardMessage}` : '',
    o.note ? `Ghi chú: ${o.note}` : '',
    `Thanh toán: ${o.paymentMethod === 'bank' ? 'Chuyển khoản' : 'Khi nhận hàng (COD)'}`,
  ]
    .filter(Boolean)
    .join('\n');
}

async function telegram(text) {
  const { TELEGRAM_BOT_TOKEN: token, TELEGRAM_CHAT_ID: chat } = process.env;
  if (!token || !chat) return;
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ chat_id: chat, text }),
  });
}

let transport;
async function email(subject, text) {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, NOTIFY_EMAIL } = process.env;
  if (!SMTP_HOST || !SMTP_USER) return;
  transport ||= nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT || 465),
    secure: Number(SMTP_PORT || 465) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
  await transport.sendMail({ from: `"${site.name}" <${SMTP_USER}>`, to: NOTIFY_EMAIL || SMTP_USER, subject, text });
}

async function newOrder(order) {
  const text = orderText(order);
  const results = await Promise.allSettled([telegram(text), email(`Đơn hàng mới ${order.code}`, text)]);
  for (const r of results) if (r.status === 'rejected') console.error('[notify]', r.reason.message);
}

async function newMessage(m) {
  const text = `✉️ Liên hệ mới từ ${m.name} – ${m.phone}\n${m.message}`;
  await Promise.allSettled([telegram(text), email(`Liên hệ mới từ ${m.name}`, text)]);
}

module.exports = { newOrder, newMessage };
