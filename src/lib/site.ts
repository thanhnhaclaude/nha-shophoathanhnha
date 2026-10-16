export const site = {
  name: "Hoa Thanh Nhã",
  tagline: "Thay lời yêu thương",
  title: "Shop hoa tươi Thanh Nhã: Đặt hoa online, giao hoa miễn phí",
  description:
    "Shop hoa tươi Thanh Nhã – đặt hoa online, giao hoa hỏa tốc 60 phút, miễn phí thiệp & băng rôn. Hoa khai trương, hoa sinh nhật, hoa chia buồn, lan hồ điệp trên 63 tỉnh thành.",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://shophoathanhnha.com",
  phone: "0396727374",
  phoneDisplay: "0396.72.73.74",
  zalo: "https://zalo.me/0396727374",
  email: "contact@hoathanhnha.com",
  hours: "06:00 – 21:00",
  promo: "Giảm 10% khi đặt hoa hôm nay và 20% đặt hoa lần sau",
  stores: [
    {
      city: "TP. Hồ Chí Minh",
      addresses: [
        "229 Đ. Quang Trung, Phường 10, Gò Vấp",
        "181 Đ. Thị Mười, P. Tân Thới Hiệp, Quận 12",
        "130 Hai Bà Trưng, Bến Nghé, Quận 1",
        "61/5 Đ. Kha Vạn Cân, Hiệp Bình Chánh, Thủ Đức",
      ],
    },
    {
      city: "Hà Nội",
      addresses: ["500 Đ. Lê Duẩn, Phương Liên, Đống Đa", "430 Đ. Cầu Giấy, Dịch Vọng, Cầu Giấy"],
    },
    {
      city: "Các tỉnh",
      addresses: [
        "Đà Nẵng: 05 Trần Văn Cẩn, Hoà Xuân, Cẩm Lệ",
        "Đà Nẵng: 396 Đ. Nguyễn Hoàng, P. Bình Thuận, Thanh Khê",
        "Huế: 265 Trần Hưng Đạo, Phú Hoà",
        "Cần Thơ: 220 Đ. Nguyễn Văn Cừ, An Hoà, Ninh Kiều",
        "Nha Trang: 76 Lê Hồng Phong, Phước Tân",
        "Vũng Tàu: 120 Trương Công Định, Phường 8",
        "Biên Hòa: 85 Hưng Đạo Vương, Trung Dũng",
      ],
    },
  ],
} as const;

export function shippingConfig() {
  return {
    fee: Number(process.env.SHIPPING_FEE ?? 30000),
    freeThreshold: Number(process.env.FREE_SHIPPING_THRESHOLD ?? 500000),
  };
}
