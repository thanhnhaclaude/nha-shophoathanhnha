// Các trang công khai của cửa hàng.
const router = require('express').Router();
const crypto = require('crypto');
const site = require('../config/site');
const store = require('../lib/store');
const catalog = require('../lib/catalog');
const orders = require('../lib/orders');
const notify = require('../lib/notify');
const seo = require('../lib/seo');
const { md, excerpt, todayVN } = require('../lib/util');
const pages = require('../content/pages');
const faq = require('../content/faq');

const home = { name: 'Trang chủ', path: '/' };

// Chặn gửi form dồn dập từ một IP (đặt hàng, liên hệ).
const hits = new Map();
function throttle(limit, windowMs) {
  return (req, res, next) => {
    const now = Date.now();
    const list = (hits.get(req.ip) || []).filter((t) => now - t < windowMs);
    if (list.length >= limit) return res.status(429).send('Bạn gửi quá nhiều yêu cầu, vui lòng thử lại sau ít phút.');
    list.push(now);
    hits.set(req.ip, list);
    next();
  };
}

router.get('/', (req, res) => {
  const all = catalog.products();
  res.render('home', {
    meta: seo.meta({ path: '/' }),
    jsonld: [seo.organization(), seo.website(), seo.faq(faq)],
    featured: all.filter((p) => p.featured).slice(0, 8),
    bestsellers: catalog.list({ sort: 'noi-bat' }).filter((p) => p.bestseller).slice(0, 4),
    posts: catalog.posts().slice(0, 3),
    faq,
  });
});

router.get('/danh-muc/:slug', (req, res, next) => {
  const cat = catalog.category(req.params.slug);
  if (!cat) return next();
  const sort = catalog.SORTS[req.query.sort] ? req.query.sort : 'noi-bat';
  const price = catalog.PRICE_RANGES[req.query.gia] ? req.query.gia : '';
  const items = catalog.list({ category: cat.slug, sort, price });
  const path = `/danh-muc/${cat.slug}`;
  const crumbs = [home, { name: cat.name, path }];
  res.render('category', {
    meta: seo.meta({ title: cat.title, description: cat.intro, path, image: cat.image, noindex: Boolean(price) }),
    jsonld: [seo.breadcrumb(crumbs), seo.itemList(items, path), ...(cat.faq && cat.faq.length ? [seo.faq(cat.faq)] : [])],
    breadcrumbs: crumbs,
    cat,
    items,
    sort,
    price,
    contentHtml: md(cat.content),
  });
});

router.get('/san-pham', (req, res) => res.redirect(301, '/danh-muc/bo-hoa-tuoi'));

router.get('/san-pham/:slug', (req, res, next) => {
  const p = catalog.product(req.params.slug);
  if (!p) return next();
  const cat = catalog.category(p.categories[0]);
  const path = `/san-pham/${p.slug}`;
  const crumbs = [home, ...(cat ? [{ name: cat.name, path: `/danh-muc/${cat.slug}` }] : []), { name: p.name, path }];
  res.render('product', {
    meta: seo.meta({ title: `${p.name} – giao nhanh`, description: p.short, path, image: p.images[0], type: 'product' }),
    jsonld: [seo.product(p, cat), seo.breadcrumb(crumbs)],
    breadcrumbs: crumbs,
    p,
    cat,
    variants: catalog.variants(p),
    related: catalog.related(p),
    descriptionHtml: md(p.description),
  });
});

router.get('/tim-kiem', (req, res) => {
  const q = String(req.query.q || '').slice(0, 80);
  res.render('search', {
    meta: seo.meta({ title: q ? `Tìm "${q}"` : 'Tìm kiếm hoa', path: '/tim-kiem', noindex: true }),
    q,
    items: q ? catalog.list({ q }) : [],
  });
});

router.get('/gio-hang', (req, res) => {
  res.render('cart', { meta: seo.meta({ title: 'Giỏ hàng', path: '/gio-hang', noindex: true }) });
});

router.post('/api/cart', (req, res) => {
  res.json(orders.priceCart(req.body.items));
});

router.get('/thanh-toan', (req, res) => {
  res.render('checkout', {
    meta: seo.meta({ title: 'Đặt hàng', path: '/thanh-toan', noindex: true }),
    values: {},
    errors: {},
    today: todayVN(),
  });
});

router.post('/thanh-toan', throttle(8, 10 * 60e3), async (req, res) => {
  if (req.body.website) return res.redirect('/'); // bẫy bot
  let items = [];
  try {
    items = JSON.parse(req.body.cart || '[]');
  } catch {
    items = [];
  }
  const cart = orders.priceCart(items);
  const errors = orders.validate(req.body);
  if (!cart.lines.length) errors.cart = 'Giỏ hàng đang trống hoặc sản phẩm đã ngừng bán.';
  if (Object.keys(errors).length) {
    return res.status(422).render('checkout', {
      meta: seo.meta({ title: 'Đặt hàng', path: '/thanh-toan', noindex: true }),
      values: req.body,
      errors,
      today: todayVN(),
    });
  }
  const order = orders.create(req.body, cart);
  notify.newOrder(order).catch(() => {});
  res.redirect(303, `/don-hang/${order.code}?k=${order.accessKey}&moi=1`);
});

router.get('/don-hang/:code', (req, res, next) => {
  const order = orders.byCode(req.params.code);
  const key = String(req.query.k || '');
  if (!order || key.length !== order.accessKey.length || !crypto.timingSafeEqual(Buffer.from(key), Buffer.from(order.accessKey))) {
    return next();
  }
  res.render('order', {
    meta: seo.meta({ title: `Đơn hàng ${order.code}`, path: `/don-hang/${order.code}`, noindex: true }),
    order,
    isNew: req.query.moi === '1',
    qr: order.paymentMethod === 'bank' && order.paymentStatus === 'unpaid' ? orders.vietQrUrl(order) : null,
    bank: orders.bankInfo(),
    STATUS: orders.STATUS,
    PAYMENT_STATUS: orders.PAYMENT_STATUS,
  });
});

router.get('/tra-cuu-don-hang', (req, res) => {
  res.render('lookup', { meta: seo.meta({ title: 'Tra cứu đơn hàng', path: '/tra-cuu-don-hang' }), error: null, values: {} });
});

router.post('/tra-cuu-don-hang', throttle(15, 10 * 60e3), (req, res) => {
  const order = orders.byCode(req.body.code);
  if (order && order.sender.phone === orders.cleanPhone(req.body.phone)) {
    return res.redirect(303, `/don-hang/${order.code}?k=${order.accessKey}`);
  }
  res.status(404).render('lookup', {
    meta: seo.meta({ title: 'Tra cứu đơn hàng', path: '/tra-cuu-don-hang' }),
    error: 'Không tìm thấy đơn hàng. Vui lòng kiểm tra lại mã đơn và số điện thoại người gửi.',
    values: req.body,
  });
});

router.get('/blog', (req, res) => {
  const crumbs = [home, { name: 'Cẩm nang hoa', path: '/blog' }];
  res.render('blog', {
    meta: seo.meta({
      title: 'Cẩm nang hoa tươi: ý nghĩa, cách chọn và chăm sóc',
      description: 'Ý nghĩa các loài hoa, gợi ý chọn hoa theo dịp và mẹo giữ hoa tươi lâu từ florist của Shop Hoa Thanh Nhã.',
      path: '/blog',
    }),
    jsonld: [seo.breadcrumb(crumbs)],
    breadcrumbs: crumbs,
    posts: catalog.posts(),
  });
});

router.get('/blog/:slug', (req, res, next) => {
  const post = catalog.post(req.params.slug);
  if (!post) return next();
  const path = `/blog/${post.slug}`;
  const crumbs = [home, { name: 'Cẩm nang hoa', path: '/blog' }, { name: post.title, path }];
  res.render('post', {
    meta: seo.meta({ title: post.title, description: post.excerpt, path, image: post.image, type: 'article' }),
    jsonld: [seo.article(post), seo.breadcrumb(crumbs)],
    breadcrumbs: crumbs,
    post,
    html: md(post.content),
    more: catalog.posts().filter((x) => x.id !== post.id).slice(0, 3),
    suggestions: catalog.list({ sort: 'noi-bat' }).slice(0, 4),
  });
});

router.get('/gioi-thieu', (req, res) => {
  const crumbs = [home, { name: 'Giới thiệu', path: '/gioi-thieu' }];
  res.render('about', {
    meta: seo.meta({
      title: 'Giới thiệu Shop Hoa Thanh Nhã',
      description: 'Câu chuyện, đội ngũ florist và cam kết chất lượng của Shop Hoa Thanh Nhã – thay lời yêu thương bằng những bó hoa tươi mỗi ngày.',
      path: '/gioi-thieu',
    }),
    jsonld: [seo.organization(), seo.breadcrumb(crumbs)],
    breadcrumbs: crumbs,
  });
});

router.get('/he-thong-cua-hang', (req, res) => {
  const crumbs = [home, { name: 'Hệ thống cửa hàng', path: '/he-thong-cua-hang' }];
  res.render('stores', {
    meta: seo.meta({
      title: 'Hệ thống cửa hàng hoa Thanh Nhã',
      description: 'Địa chỉ các cửa hàng hoa Thanh Nhã tại TP. Hồ Chí Minh, Hà Nội, Đà Nẵng, Huế, Cần Thơ, Nha Trang, Vũng Tàu, Biên Hòa.',
      path: '/he-thong-cua-hang',
    }),
    jsonld: [seo.organization(), seo.breadcrumb(crumbs)],
    breadcrumbs: crumbs,
  });
});

router.get('/cau-hoi-thuong-gap', (req, res) => {
  const crumbs = [home, { name: 'Câu hỏi thường gặp', path: '/cau-hoi-thuong-gap' }];
  res.render('faq', {
    meta: seo.meta({ title: 'Câu hỏi thường gặp khi đặt hoa', description: faq[0].a, path: '/cau-hoi-thuong-gap' }),
    jsonld: [seo.faq(faq), seo.breadcrumb(crumbs)],
    breadcrumbs: crumbs,
    faq,
  });
});

router.get('/lien-he', (req, res) => {
  const crumbs = [home, { name: 'Liên hệ', path: '/lien-he' }];
  res.render('contact', {
    meta: seo.meta({ title: 'Liên hệ đặt hoa', description: `Gọi hoặc nhắn Zalo ${site.phoneDisplay} để đặt hoa, mở cửa ${site.hours} mỗi ngày.`, path: '/lien-he' }),
    jsonld: [seo.organization(), seo.breadcrumb(crumbs)],
    breadcrumbs: crumbs,
    sent: req.query.da_gui === '1',
    values: {},
    errors: {},
  });
});

router.post('/lien-he', throttle(5, 10 * 60e3), (req, res) => {
  if (req.body.website) return res.redirect('/lien-he');
  const errors = {};
  if (!String(req.body.name || '').trim()) errors.name = 'Vui lòng nhập họ tên';
  if (!orders.validPhone(req.body.phone)) errors.phone = 'Số điện thoại chưa đúng';
  if (String(req.body.message || '').trim().length < 5) errors.message = 'Vui lòng nhập nội dung';
  if (Object.keys(errors).length) {
    const crumbs = [home, { name: 'Liên hệ', path: '/lien-he' }];
    return res.status(422).render('contact', {
      meta: seo.meta({ title: 'Liên hệ đặt hoa', path: '/lien-he' }),
      breadcrumbs: crumbs,
      sent: false,
      values: req.body,
      errors,
    });
  }
  const msg = store.insert('messages', {
    name: String(req.body.name).trim().slice(0, 80),
    phone: orders.cleanPhone(req.body.phone),
    message: String(req.body.message).trim().slice(0, 2000),
    read: false,
  });
  notify.newMessage(msg).catch(() => {});
  res.redirect(303, '/lien-he?da_gui=1');
});

router.get('/chinh-sach/:slug', (req, res, next) => {
  const page = pages[req.params.slug];
  if (!page) return next();
  const path = `/chinh-sach/${req.params.slug}`;
  const crumbs = [home, { name: page.title, path }];
  res.render('page', {
    meta: seo.meta({ title: page.title, description: page.description || excerpt(page.body), path }),
    jsonld: [seo.breadcrumb(crumbs)],
    breadcrumbs: crumbs,
    page,
    html: md(page.body),
  });
});

module.exports = router;
