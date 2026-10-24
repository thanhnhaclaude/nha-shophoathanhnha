// Thông tin cửa hàng dùng chung cho giao diện, SEO và dữ liệu có cấu trúc.
// Thông tin liên hệ lấy theo shop Hoa Thanh Nhã; có thể ghi đè trong Admin > Cài đặt.
const site = {
  name: 'Shop Hoa Thanh Nhã',
  shortName: 'Thanh Nhã',
  legalName: 'Shop Hoa Tươi Thanh Nhã',
  tagline: 'Thay lời yêu thương',
  url: (process.env.SITE_URL || 'https://shophoathanhnha.com').replace(/\/$/, ''),
  title: 'Shop Hoa Thanh Nhã – Đặt hoa tươi online, giao nhanh tận nơi',
  description:
    'Shop Hoa Thanh Nhã cắm hoa tươi mỗi sáng: hoa sinh nhật, hoa khai trương, hoa cưới, hoa chia buồn, lan hồ điệp. Đặt online, giao nhanh nội thành, tặng thiệp viết tay.',
  phone: '0396727374',
  phoneDisplay: '0396.72.73.74',
  zalo: 'https://zalo.me/0396727374',
  email: 'contact@shophoathanhnha.com',
  hours: '06:00 – 21:00',
  openingHours: { opens: '06:00', closes: '21:00' },
  priceRange: '350.000đ – 5.000.000đ',
  freeShipFrom: 500000,
  shippingFee: 30000,
  socials: [
    { name: 'Facebook', href: 'https://www.facebook.com/hoatuoithanhnha/' },
    { name: 'Instagram', href: 'https://www.instagram.com/hoatuoithanhnha/' },
    { name: 'YouTube', href: 'https://www.youtube.com/channel/UCe2zrO2IXG4P3xIZ9I3ixUQ' },
  ],
  // Cửa hàng chính dùng cho dữ liệu LocalBusiness.
  mainStore: {
    street: '130 Hai Bà Trưng, Bến Nghé',
    district: 'Quận 1',
    city: 'TP. Hồ Chí Minh',
    region: 'Hồ Chí Minh',
    postalCode: '700000',
    lat: 10.7797,
    lng: 106.7006,
  },
  stores: [
    {
      city: 'TP. Hồ Chí Minh',
      addresses: [
        '130 Hai Bà Trưng, Bến Nghé, Quận 1',
        '229 Đ. Quang Trung, Phường 10, Gò Vấp',
        '181 Đ. Thị Mười, P. Tân Thới Hiệp, Quận 12',
        '61/5 Đ. Kha Vạn Cân, Hiệp Bình Chánh, Thủ Đức',
      ],
    },
    { city: 'Hà Nội', addresses: ['500 Đ. Lê Duẩn, Phương Liên, Đống Đa', '430 Đ. Cầu Giấy, Dịch Vọng, Cầu Giấy'] },
    {
      city: 'Các tỉnh',
      addresses: [
        'Đà Nẵng: 05 Trần Văn Cẩn, Hoà Xuân, Cẩm Lệ',
        'Đà Nẵng: 396 Đ. Nguyễn Hoàng, P. Bình Thuận, Thanh Khê',
        'Huế: 265 Trần Hưng Đạo, Phú Hoà',
        'Cần Thơ: 220 Đ. Nguyễn Văn Cừ, An Hoà, Ninh Kiều',
        'Nha Trang: 76 Lê Hồng Phong, Phước Tân',
        'Vũng Tàu: 120 Trương Công Định, Phường 8',
        'Biên Hòa: 85 Hưng Đạo Vương, Trung Dũng',
      ],
    },
  ],
  // Tài khoản nhận chuyển khoản (VietQR). Đặt qua biến môi trường hoặc Admin > Cài đặt.
  bank: {
    bin: process.env.VIETQR_BANK_BIN || '',
    account: process.env.VIETQR_ACCOUNT || '',
    name: process.env.VIETQR_ACCOUNT_NAME || '',
    bankName: process.env.VIETQR_BANK_NAME || '',
  },
  deliverySlots: ['08:00 – 10:00', '10:00 – 12:00', '12:00 – 14:00', '14:00 – 16:00', '16:00 – 18:00', '18:00 – 20:00'],
};

module.exports = site;
