// Trang quản trị: đơn hàng, sản phẩm, bài viết, liên hệ, cài đặt.
const path = require('path');
const crypto = require('crypto');
const router = require('express').Router();
const multer = require('multer');
const store = require('../lib/store');
const catalog = require('../lib/catalog');
const orders = require('../lib/orders');
const auth = require('../lib/auth');
const { slugify, todayVN } = require('../lib/util');

const upload = multer({
  storage: multer.diskStorage({
    destination: path.join(store.DATA_DIR, 'uploads'),
    filename: (req, file, cb) => {
      const ext = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'image/avif': '.avif' }[file.mimetype];
      const base = slugify(path.parse(file.originalname).name).slice(0, 50) || 'anh';
      cb(null, `${base}-${crypto.randomBytes(3).toString('hex')}${ext}`);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024, files: 6 },
  fileFilter: (req, file, cb) => cb(null, /^image\/(jpeg|png|webp|avif)$/.test(file.mimetype)),
});

router.use((req, res, next) => {
  res.set('X-Robots-Tag', 'noindex, nofollow');
  res.locals.meta = { ...res.locals.meta, title: 'Quản trị – Shop Hoa Thanh Nhã', robots: 'noindex, nofollow' };
  res.locals.STATUS = orders.STATUS;
  res.locals.PAYMENT_STATUS = orders.PAYMENT_STATUS;
  next();
});

router.get('/dang-nhap', (req, res) => {
  if (auth.isAdmin(req)) return res.redirect('/admin');
  res.render('admin/login', { error: null, next: req.query.next || '/admin', configured: Boolean(process.env.ADMIN_PASSWORD || process.env.ADMIN_PASSWORD_HASH) });
});

router.post('/dang-nhap', auth.loginRateLimit, (req, res) => {
  const nextUrl = String(req.body.next || '/admin');
  const safeNext = nextUrl.startsWith('/admin') ? nextUrl : '/admin';
  if (auth.checkPassword(String(req.body.password || ''))) {
    auth.login(res);
    return res.redirect(303, safeNext);
  }
  req.recordFailedLogin();
  res.status(401).render('admin/login', { error: 'Mật khẩu không đúng.', next: safeNext, configured: true });
});

router.use(auth.requireAdmin);
router.use((req, res, next) => {
  res.locals.csrf = auth.csrfToken(req);
  res.locals.unread = store.all('messages').filter((m) => !m.read).length;
  res.locals.newOrders = store.all('orders').filter((o) => o.status === 'new').length;
  next();
});

router.post('/dang-xuat', auth.verifyCsrf, (req, res) => {
  auth.logout(res);
  res.redirect(303, '/admin/dang-nhap');
});

router.get('/', (req, res) => {
  const all = store.all('orders');
  const today = todayVN();
  const month = today.slice(0, 7);
  const vnDate = (iso) => new Date(new Date(iso).getTime() + 7 * 3600e3).toISOString().slice(0, 10);
  const valid = all.filter((o) => o.status !== 'cancelled');
  res.render('admin/dashboard', {
    stats: {
      today: valid.filter((o) => vnDate(o.createdAt) === today).length,
      deliverToday: valid.filter((o) => o.delivery.date === today && o.status !== 'done').length,
      monthRevenue: valid.filter((o) => vnDate(o.createdAt).startsWith(month)).reduce((s, o) => s + o.total, 0),
      products: catalog.products().length,
    },
    recent: all.slice(0, 8),
  });
});

// ---- Đơn hàng
router.get('/don-hang', (req, res) => {
  const status = orders.STATUS[req.query.status] ? req.query.status : '';
  const q = String(req.query.q || '').trim().toLowerCase();
  let list = store.all('orders');
  if (status) list = list.filter((o) => o.status === status);
  if (q) list = list.filter((o) => [o.code, o.sender.name, o.sender.phone, o.recipient.name, o.recipient.phone].join(' ').toLowerCase().includes(q));
  res.render('admin/orders', { list, status, q });
});

router.get('/don-hang/:id', (req, res, next) => {
  const order = store.byId('orders', req.params.id);
  if (!order) return next();
  res.render('admin/order', { order, saved: req.query.ok === '1' });
});

router.post('/don-hang/:id', auth.verifyCsrf, (req, res) => {
  const patch = {};
  if (orders.STATUS[req.body.status]) patch.status = req.body.status;
  if (orders.PAYMENT_STATUS[req.body.paymentStatus]) patch.paymentStatus = req.body.paymentStatus;
  patch.adminNote = String(req.body.adminNote || '').slice(0, 1000);
  store.update('orders', req.params.id, patch);
  res.redirect(303, `/admin/don-hang/${req.params.id}?ok=1`);
});

// ---- Sản phẩm
router.get('/san-pham', (req, res) => {
  res.render('admin/products', { list: store.all('products'), categories: catalog.categories() });
});

router.get('/san-pham/moi', (req, res) => {
  res.render('admin/product-form', { p: { categories: [], images: [] }, categories: catalog.categories(), error: null });
});

router.get('/san-pham/:id', (req, res, next) => {
  const p = store.byId('products', req.params.id);
  if (!p) return next();
  res.render('admin/product-form', { p, categories: catalog.categories(), error: null, saved: req.query.ok === '1' });
});

function productFromBody(body, files, existing = {}) {
  const kept = [].concat(body.keepImages || []).filter((x) => (existing.images || []).includes(x));
  const added = (files || []).map((f) => `/uploads/${f.filename}`);
  const num = (v) => (v === '' || v == null ? undefined : Math.max(0, parseInt(String(v).replace(/\D/g, ''), 10) || 0));
  return {
    name: String(body.name || '').trim(),
    slug: slugify(body.slug || body.name),
    sku: String(body.sku || '').trim(),
    price: num(body.price) || 0,
    salePrice: num(body.salePrice),
    categories: [].concat(body.categories || []),
    flowers: String(body.flowers || '').trim(),
    short: String(body.short || '').trim(),
    description: String(body.description || ''),
    images: [...kept, ...added],
    featured: body.featured === 'on',
    bestseller: body.bestseller === 'on',
    active: body.active === 'on',
    inStock: body.inStock === 'on',
  };
}

function saveProduct(req, res) {
  const existing = req.params.id ? store.byId('products', req.params.id) : null;
  const data = productFromBody(req.body, req.files, existing || {});
  const clash = store.all('products').find((x) => x.slug === data.slug && (!existing || x.id !== existing.id));
  const error = !data.name ? 'Vui lòng nhập tên sản phẩm' : !data.price ? 'Vui lòng nhập giá' : !data.images.length ? 'Cần ít nhất 1 ảnh' : clash ? 'Đường dẫn đã tồn tại' : null;
  if (error) return res.status(422).render('admin/product-form', { p: { ...existing, ...data }, categories: catalog.categories(), error });
  const saved = existing ? store.update('products', existing.id, data) : store.insert('products', data);
  res.redirect(303, `/admin/san-pham/${saved.id}?ok=1`);
}

router.post('/san-pham', upload.array('images', 6), auth.verifyCsrf, saveProduct);
router.post('/san-pham/:id', upload.array('images', 6), auth.verifyCsrf, saveProduct);
router.post('/san-pham/:id/xoa', auth.verifyCsrf, (req, res) => {
  store.remove('products', req.params.id);
  res.redirect(303, '/admin/san-pham');
});

// ---- Bài viết
router.get('/bai-viet', (req, res) => res.render('admin/posts', { list: store.all('posts') }));
router.get('/bai-viet/moi', (req, res) => res.render('admin/post-form', { post: { published: true, publishedAt: new Date().toISOString() }, error: null }));
router.get('/bai-viet/:id', (req, res, next) => {
  const post = store.byId('posts', req.params.id);
  if (!post) return next();
  res.render('admin/post-form', { post, error: null, saved: req.query.ok === '1' });
});

function savePost(req, res) {
  const existing = req.params.id ? store.byId('posts', req.params.id) : null;
  const b = req.body;
  const data = {
    title: String(b.title || '').trim(),
    slug: slugify(b.slug || b.title),
    excerpt: String(b.excerpt || '').trim(),
    content: String(b.content || ''),
    tags: String(b.tags || '').split(',').map((t) => t.trim()).filter(Boolean),
    image: req.file ? `/uploads/${req.file.filename}` : (existing && existing.image) || '',
    published: b.published === 'on',
    publishedAt: b.publishedAt ? new Date(b.publishedAt).toISOString() : new Date().toISOString(),
  };
  const clash = store.all('posts').find((x) => x.slug === data.slug && (!existing || x.id !== existing.id));
  const error = !data.title ? 'Vui lòng nhập tiêu đề' : !data.image ? 'Cần ảnh đại diện' : clash ? 'Đường dẫn đã tồn tại' : null;
  if (error) return res.status(422).render('admin/post-form', { post: { ...existing, ...data }, error });
  const saved = existing ? store.update('posts', existing.id, data) : store.insert('posts', data);
  res.redirect(303, `/admin/bai-viet/${saved.id}?ok=1`);
}

router.post('/bai-viet', upload.single('image'), auth.verifyCsrf, savePost);
router.post('/bai-viet/:id', upload.single('image'), auth.verifyCsrf, savePost);
router.post('/bai-viet/:id/xoa', auth.verifyCsrf, (req, res) => {
  store.remove('posts', req.params.id);
  res.redirect(303, '/admin/bai-viet');
});

// ---- Liên hệ
router.get('/lien-he', (req, res) => res.render('admin/messages', { list: store.all('messages') }));
router.post('/lien-he/:id/da-doc', auth.verifyCsrf, (req, res) => {
  store.update('messages', req.params.id, { read: true });
  res.redirect(303, '/admin/lien-he');
});

// ---- Cài đặt
router.get('/cai-dat', (req, res) => res.render('admin/settings', { s: store.getSettings(), saved: req.query.ok === '1' }));
router.post('/cai-dat', auth.verifyCsrf, (req, res) => {
  const b = req.body;
  store.saveSettings({
    announcement: String(b.announcement || '').slice(0, 200),
    bank: {
      bin: String(b.bankBin || '').trim(),
      account: String(b.bankAccount || '').trim(),
      name: String(b.bankAccountName || '').trim().toUpperCase(),
      bankName: String(b.bankName || '').trim(),
    },
    gaId: String(b.gaId || '').trim(),
    gscVerification: String(b.gscVerification || '').trim(),
  });
  res.redirect(303, '/admin/cai-dat?ok=1');
});

module.exports = router;
