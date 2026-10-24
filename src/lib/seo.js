// Thẻ meta và dữ liệu có cấu trúc (schema.org) theo Cẩm nang SEO của Google.
const site = require('../config/site');
const { finalPrice, excerpt } = require('./util');

const abs = (p) => (/^https?:/.test(p) ? p : `${site.url}${p.startsWith('/') ? '' : '/'}${p}`);

function meta({ title, description, path = '/', image, type = 'website', noindex = false }) {
  const fullTitle = !title ? site.title : title.includes(site.shortName) ? title : `${title} | ${site.name}`;
  return {
    title: fullTitle,
    description: excerpt(description || site.description, 160),
    canonical: abs(path.split('?')[0]),
    image: abs(image || '/images/og-default.jpg'),
    type,
    robots: noindex ? 'noindex, follow' : 'index, follow, max-image-preview:large',
  };
}

function organization() {
  const s = site.mainStore;
  return {
    '@context': 'https://schema.org',
    '@type': 'Florist',
    '@id': `${site.url}/#florist`,
    name: site.name,
    alternateName: site.legalName,
    url: site.url,
    logo: abs('/images/logo.png'),
    image: abs('/images/site/cua-hang-hoa.webp'),
    telephone: `+84${site.phone.slice(1)}`,
    email: site.email,
    priceRange: site.priceRange,
    address: {
      '@type': 'PostalAddress',
      streetAddress: s.street,
      addressLocality: s.district,
      addressRegion: s.region,
      postalCode: s.postalCode,
      addressCountry: 'VN',
    },
    geo: { '@type': 'GeoCoordinates', latitude: s.lat, longitude: s.lng },
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
        opens: site.openingHours.opens,
        closes: site.openingHours.closes,
      },
    ],
    areaServed: 'VN',
    sameAs: site.socials.map((x) => x.href),
  };
}

function website() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${site.url}/#website`,
    name: site.name,
    url: site.url,
    inLanguage: 'vi-VN',
    publisher: { '@id': `${site.url}/#florist` },
    potentialAction: {
      '@type': 'SearchAction',
      target: { '@type': 'EntryPoint', urlTemplate: `${site.url}/tim-kiem?q={search_term_string}` },
      'query-input': 'required name=search_term_string',
    },
  };
}

function breadcrumb(items) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({ '@type': 'ListItem', position: i + 1, name: it.name, item: abs(it.path) })),
  };
}

function product(p, category) {
  const validUntil = new Date(Date.now() + 180 * 864e5).toISOString().slice(0, 10);
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: p.name,
    sku: p.sku,
    image: p.images.map(abs),
    description: excerpt(p.short || p.description, 300),
    category: category ? category.name : undefined,
    brand: { '@type': 'Brand', name: site.name },
    offers: {
      '@type': 'Offer',
      url: abs(`/san-pham/${p.slug}`),
      priceCurrency: 'VND',
      price: finalPrice(p),
      priceValidUntil: validUntil,
      availability: p.inStock === false ? 'https://schema.org/OutOfStock' : 'https://schema.org/InStock',
      itemCondition: 'https://schema.org/NewCondition',
      seller: { '@id': `${site.url}/#florist` },
      shippingDetails: {
        '@type': 'OfferShippingDetails',
        shippingRate: { '@type': 'MonetaryAmount', value: finalPrice(p) >= site.freeShipFrom ? 0 : site.shippingFee, currency: 'VND' },
        shippingDestination: { '@type': 'DefinedRegion', addressCountry: 'VN' },
        deliveryTime: {
          '@type': 'ShippingDeliveryTime',
          handlingTime: { '@type': 'QuantitativeValue', minValue: 0, maxValue: 0, unitCode: 'DAY' },
          transitTime: { '@type': 'QuantitativeValue', minValue: 0, maxValue: 1, unitCode: 'DAY' },
        },
      },
      hasMerchantReturnPolicy: {
        '@type': 'MerchantReturnPolicy',
        applicableCountry: 'VN',
        returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
        merchantReturnDays: 1,
        returnMethod: 'https://schema.org/ReturnByMail',
        returnFees: 'https://schema.org/FreeReturn',
      },
    },
  };
}

function itemList(products, path) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    url: abs(path),
    itemListElement: products.map((p, i) => ({ '@type': 'ListItem', position: i + 1, url: abs(`/san-pham/${p.slug}`), name: p.name })),
  };
}

function article(post) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt,
    image: [abs(post.image)],
    datePublished: post.publishedAt,
    dateModified: post.updatedAt || post.publishedAt,
    author: { '@type': 'Organization', name: site.name, url: site.url },
    publisher: { '@id': `${site.url}/#florist` },
    mainEntityOfPage: abs(`/blog/${post.slug}`),
    inLanguage: 'vi-VN',
  };
}

function faq(items) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((q) => ({ '@type': 'Question', name: q.q, acceptedAnswer: { '@type': 'Answer', text: q.a } })),
  };
}

module.exports = { abs, meta, organization, website, breadcrumb, product, itemList, article, faq };
