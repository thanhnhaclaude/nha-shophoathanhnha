// Truy vấn sản phẩm, danh mục, bài viết từ kho dữ liệu.
const store = require('./store');
const { finalPrice, stripDiacritics } = require('./util');

const categories = () => store.all('categories').slice().sort((a, b) => (a.order || 99) - (b.order || 99));
const category = (slug) => store.bySlug('categories', slug);

const products = () => store.all('products').filter((p) => p.active !== false);
const product = (slug) => products().find((p) => p.slug === slug);
const productById = (id) => products().find((p) => p.id === id);

// Mỗi sản phẩm có bản Tiêu chuẩn và bản Sang trọng (thêm hoa, gói cao cấp) nếu không tự khai báo.
function variants(p) {
  if (Array.isArray(p.variants) && p.variants.length) return p.variants;
  const add = Math.round((finalPrice(p) * 0.3) / 10000) * 10000;
  return [
    { name: 'Tiêu chuẩn', add: 0 },
    { name: 'Sang trọng', add, note: 'Thêm hoa, gói cao cấp' },
  ];
}

const SORTS = {
  'noi-bat': (a, b) => (b.bestseller ? 1 : 0) - (a.bestseller ? 1 : 0) || (b.featured ? 1 : 0) - (a.featured ? 1 : 0),
  'gia-tang': (a, b) => finalPrice(a) - finalPrice(b),
  'gia-giam': (a, b) => finalPrice(b) - finalPrice(a),
  moi: (a, b) => String(b.createdAt || b.id).localeCompare(String(a.createdAt || a.id)),
};

const PRICE_RANGES = {
  'duoi-500k': [0, 500000],
  '500k-1tr': [500000, 1000000],
  '1tr-2tr': [1000000, 2000000],
  'tren-2tr': [2000000, Infinity],
};

function list({ category: cat, sort = 'noi-bat', price, q } = {}) {
  let out = products();
  if (cat) out = out.filter((p) => p.categories.includes(cat));
  if (price && PRICE_RANGES[price]) {
    const [lo, hi] = PRICE_RANGES[price];
    out = out.filter((p) => finalPrice(p) >= lo && finalPrice(p) < hi);
  }
  if (q) {
    const terms = stripDiacritics(q).split(' ').filter(Boolean);
    out = out.filter((p) => {
      const hay = stripDiacritics(`${p.name} ${p.flowers} ${p.short} ${p.categories.join(' ')}`);
      return terms.every((t) => hay.includes(t));
    });
  }
  return out.slice().sort(SORTS[sort] || SORTS['noi-bat']);
}

function related(p, n = 4) {
  return products()
    .filter((x) => x.id !== p.id && x.categories.some((c) => p.categories.includes(c)))
    .slice(0, n);
}

const posts = () =>
  store
    .all('posts')
    .filter((p) => p.published !== false)
    .slice()
    .sort((a, b) => String(b.publishedAt).localeCompare(String(a.publishedAt)));
const post = (slug) => posts().find((p) => p.slug === slug);

module.exports = { categories, category, products, product, productById, variants, list, related, posts, post, SORTS, PRICE_RANGES };
