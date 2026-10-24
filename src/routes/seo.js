// sitemap.xml, robots.txt, llms.txt
const router = require('express').Router();
const site = require('../config/site');
const catalog = require('../lib/catalog');
const pages = require('../content/pages');

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

router.get('/sitemap.xml', (req, res) => {
  const today = new Date().toISOString().slice(0, 10);
  const urls = [
    { loc: '/', priority: '1.0', changefreq: 'daily' },
    ...catalog.categories().map((c) => ({ loc: `/danh-muc/${c.slug}`, priority: '0.9', changefreq: 'daily', image: c.image })),
    ...catalog.products().map((p) => ({
      loc: `/san-pham/${p.slug}`,
      priority: '0.8',
      changefreq: 'weekly',
      lastmod: (p.updatedAt || p.createdAt || '').slice(0, 10) || today,
      image: p.images[0],
      imageTitle: p.name,
    })),
    { loc: '/blog', priority: '0.7', changefreq: 'weekly' },
    ...catalog.posts().map((p) => ({ loc: `/blog/${p.slug}`, priority: '0.6', lastmod: (p.updatedAt || p.publishedAt).slice(0, 10), image: p.image, imageTitle: p.title })),
    ...['/gioi-thieu', '/lien-he', '/cau-hoi-thuong-gap', '/he-thong-cua-hang'].map((loc) => ({ loc, priority: '0.5' })),
    ...Object.keys(pages).map((slug) => ({ loc: `/chinh-sach/${slug}`, priority: '0.3' })),
  ];
  const body = urls
    .map(
      (u) =>
        `<url><loc>${site.url}${u.loc}</loc>${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ''}${u.changefreq ? `<changefreq>${u.changefreq}</changefreq>` : ''}<priority>${u.priority}</priority>${
          u.image ? `<image:image><image:loc>${site.url}${u.image}</image:loc>${u.imageTitle ? `<image:title>${esc(u.imageTitle)}</image:title>` : ''}</image:image>` : ''
        }</url>`,
    )
    .join('');
  res
    .type('application/xml')
    .send(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">${body}</urlset>`);
});

router.get('/robots.txt', (req, res) => {
  res.type('text/plain').send(
    [
      'User-agent: *',
      'Allow: /',
      'Disallow: /admin',
      'Disallow: /gio-hang',
      'Disallow: /thanh-toan',
      'Disallow: /don-hang/',
      'Disallow: /tim-kiem',
      'Disallow: /*?*sort=',
      '',
      `Sitemap: ${site.url}/sitemap.xml`,
    ].join('\n'),
  );
});

// Tóm tắt dành cho trợ lý AI (ChatGPT, Claude, Perplexity…) theo chuẩn llms.txt.
router.get('/llms.txt', (req, res) => {
  const lines = [
    `# ${site.name}`,
    '',
    `> ${site.description}`,
    '',
    `- Hotline/Zalo: ${site.phoneDisplay} · Giờ mở cửa: ${site.hours} hằng ngày`,
    `- Miễn phí giao nội thành cho đơn từ ${site.freeShipFrom.toLocaleString('vi-VN')}đ, tặng thiệp viết tay`,
    `- Thanh toán: chuyển khoản VietQR hoặc tiền mặt khi nhận hoa`,
    '',
    '## Danh mục',
    ...catalog.categories().map((c) => `- [${c.name}](${site.url}/danh-muc/${c.slug}): ${c.intro}`),
    '',
    '## Sản phẩm',
    ...catalog.products().map((p) => `- [${p.name}](${site.url}/san-pham/${p.slug}): ${(p.salePrice || p.price).toLocaleString('vi-VN')}đ – ${p.short}`),
    '',
    '## Cẩm nang',
    ...catalog.posts().map((p) => `- [${p.title}](${site.url}/blog/${p.slug}): ${p.excerpt}`),
    '',
    '## Cửa hàng',
    ...site.stores.flatMap((s) => s.addresses.map((a) => `- ${s.city === 'Các tỉnh' ? a : `${a}, ${s.city}`}`)),
  ];
  res.type('text/plain; charset=utf-8').send(lines.join('\n'));
});

module.exports = router;
