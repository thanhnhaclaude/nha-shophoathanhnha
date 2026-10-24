// Đăng nhập admin bằng một mật khẩu, phiên lưu trong cookie ký HMAC (không cần CSDL phiên).
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

const COOKIE = 'tn_admin';
const MAX_AGE = 7 * 864e5;
const SECRET = process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');

if (!process.env.SESSION_SECRET && process.env.NODE_ENV === 'production') {
  console.warn('[auth] Chưa đặt SESSION_SECRET: phiên admin sẽ mất mỗi lần khởi động lại.');
}

const sign = (v) => crypto.createHmac('sha256', SECRET).update(v).digest('base64url');

function checkPassword(input) {
  const hash = process.env.ADMIN_PASSWORD_HASH;
  if (hash) return bcrypt.compareSync(input, hash);
  const plain = process.env.ADMIN_PASSWORD;
  if (!plain) return false;
  const a = Buffer.from(input);
  const b = Buffer.from(plain);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function login(res) {
  const exp = String(Date.now() + MAX_AGE);
  res.cookie(COOKIE, `${exp}.${sign(exp)}`, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: MAX_AGE,
    path: '/',
  });
}

function logout(res) {
  res.clearCookie(COOKIE, { path: '/' });
}

function isAdmin(req) {
  const raw = req.cookies && req.cookies[COOKIE];
  if (!raw) return false;
  const [exp, sig] = raw.split('.');
  if (!exp || !sig || Number(exp) < Date.now()) return false;
  const expected = sign(exp);
  return sig.length === expected.length && crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
}

function requireAdmin(req, res, next) {
  if (isAdmin(req)) return next();
  res.redirect(`/admin/dang-nhap?next=${encodeURIComponent(req.originalUrl)}`);
}

// Token CSRF gắn với phiên admin: form admin phải gửi kèm.
const csrfToken = (req) => sign(`csrf:${(req.cookies && req.cookies[COOKIE]) || ''}`);

function verifyCsrf(req, res, next) {
  if (req.method !== 'POST') return next();
  const token = (req.body && req.body._csrf) || req.get('x-csrf-token');
  if (token && token === csrfToken(req)) return next();
  res.status(403).send('Phiên làm việc hết hạn, vui lòng tải lại trang.');
}

// Giới hạn số lần đăng nhập sai theo IP.
const attempts = new Map();
function loginRateLimit(req, res, next) {
  const key = req.ip;
  const now = Date.now();
  const a = (attempts.get(key) || []).filter((t) => now - t < 15 * 60e3);
  attempts.set(key, a);
  if (a.length >= 8) return res.status(429).send('Thử quá nhiều lần, vui lòng đợi 15 phút.');
  req.recordFailedLogin = () => a.push(now);
  next();
}

module.exports = { checkPassword, login, logout, isAdmin, requireAdmin, csrfToken, verifyCsrf, loginRateLimit };
