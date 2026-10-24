// Điểm khởi động ứng dụng (Hostinger: Entry file = server.js).
const path = require('path');

// Đọc file .env khi chạy trên máy (Hostinger đặt biến môi trường trong hPanel).
try {
  process.loadEnvFile(path.join(__dirname, '.env'));
} catch {
  /* không có .env */
}

const express = require('express');
const compression = require('compression');
const cookieParser = require('cookie-parser');

const site = require('./src/config/site');
const store = require('./src/lib/store');
const util = require('./src/lib/util');
const catalog = require('./src/lib/catalog');
const seo = require('./src/lib/seo');
const auth = require('./src/lib/auth');

store.init();

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 1);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
if (process.env.NODE_ENV === 'production') app.set('view cache', true);

app.use(compression());

// Chuyển www -> không www và http -> https để chỉ có một phiên bản URL chính tắc.
app.use((req, res, next) => {
  if (process.env.NODE_ENV !== 'production') return next();
  const host = req.get('host') || '';
  const wantHost = new URL(site.url).host;
  if (host.startsWith('www.') || (req.protocol !== 'https' && host === wantHost)) {
    return res.redirect(301, `${site.url}${req.originalUrl}`);
  }
  next();
});

app.use((req, res, next) => {
  res.set({
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'X-Frame-Options': 'SAMEORIGIN',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  });
  next();
});

const oneYear = 365 * 864e5;
app.use(
  express.static(path.join(__dirname, 'public'), {
    maxAge: process.env.NODE_ENV === 'production' ? '7d' : 0,
    setHeaders(res, file) {
      if (/\.(webp|avif|jpg|png|svg|woff2)$/.test(file)) res.setHeader('Cache-Control', `public, max-age=${oneYear / 1000}, immutable`);
    },
  }),
);
app.use('/uploads', express.static(path.join(store.DATA_DIR, 'uploads'), { maxAge: '30d' }));

app.use(express.urlencoded({ extended: true, limit: '200kb' }));
app.use(express.json({ limit: '200kb' }));
app.use(cookieParser());

// Biến dùng chung cho mọi view.
const assetVersion = Date.now().toString(36);
app.use((req, res, next) => {
  const settings = store.getSettings();
  Object.assign(res.locals, util, {
    site,
    settings,
    seo,
    path: req.path,
    navCategories: catalog.categories(),
    isAdmin: auth.isAdmin(req),
    meta: seo.meta({ path: req.path }),
    jsonld: [],
    breadcrumbs: null,
    v: assetVersion,
  });
  next();
});

app.use('/admin', require('./src/routes/admin'));
app.use('/', require('./src/routes/seo'));
app.use('/', require('./src/routes/shop'));

app.use((req, res) => {
  res.status(404).render('404', { meta: seo.meta({ title: 'Không tìm thấy trang', path: req.path, noindex: true }) });
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).render('404', {
    meta: seo.meta({ title: 'Có lỗi xảy ra', path: req.path, noindex: true }),
    errorPage: true,
  });
});

const port = Number(process.env.PORT) || 3000;
if (require.main === module) {
  app.listen(port, () => console.log(`Shop Hoa Thanh Nhã chạy tại http://localhost:${port}`));
}

module.exports = app;
