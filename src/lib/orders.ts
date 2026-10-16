import "server-only";
import { randomBytes } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db, orders, orderItems } from "./db";
import { effectivePrice } from "./format";
import { getProductsByIds } from "./queries";
import { shippingConfig } from "./site";

const phone = z
  .string()
  .trim()
  .transform((v) => v.replace(/[\s.-]/g, ""))
  .pipe(z.string().regex(/^(\+84|0)\d{9,10}$/, "Số điện thoại không hợp lệ"));

export const checkoutSchema = z.object({
  senderName: z.string().trim().min(2, "Vui lòng nhập họ tên người đặt").max(120),
  senderPhone: phone,
  senderEmail: z.union([z.literal(""), z.email("Email không hợp lệ")]).optional(),
  recipientName: z.string().trim().min(2, "Vui lòng nhập tên người nhận").max(120),
  recipientPhone: phone,
  address: z.string().trim().min(5, "Vui lòng nhập địa chỉ giao hoa").max(500),
  city: z.string().trim().min(2, "Vui lòng chọn tỉnh/thành").max(120),
  deliveryDate: z.iso.date("Vui lòng chọn ngày giao"),
  deliveryTime: z.string().trim().min(1, "Vui lòng chọn khung giờ").max(40),
  cardMessage: z.string().trim().max(1000).optional(),
  bannerMessage: z.string().trim().max(500).optional(),
  note: z.string().trim().max(1000).optional(),
  paymentMethod: z.enum(["vietqr", "cod"]),
  items: z
    .array(z.object({ id: z.number().int().positive(), quantity: z.number().int().min(1).max(99) }))
    .min(1, "Giỏ hàng đang trống")
    .max(50),
});

export type CheckoutInput = z.input<typeof checkoutSchema>;

function todayInVN() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Ho_Chi_Minh" });
}

/**
 * Tiền tố mã đơn (mặc định "TN"). Mỗi website dùng chung tài khoản ngân hàng phải có tiền tố riêng,
 * để webhook SePay của website này không nhận nhầm giao dịch của website kia.
 */
export function orderPrefix() {
  const p = process.env.ORDER_CODE_PREFIX?.trim().toUpperCase();
  return p && /^[A-Z]{2,4}$/.test(p) ? p : "TN";
}

function makeCode() {
  // Tiền tố + 6 chữ số ngẫu nhiên, dễ đọc khi chuyển khoản
  return `${orderPrefix()}${String(randomBytes(4).readUInt32BE() % 1_000_000).padStart(6, "0")}`;
}

/** Tạo đơn hàng. Giá luôn được tính lại từ CSDL, không tin giá gửi từ trình duyệt. */
export async function createOrder(raw: unknown) {
  const parsed = checkoutSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false as const, errors: z.flattenError(parsed.error).fieldErrors, message: "Vui lòng kiểm tra lại thông tin" };
  }
  const input = parsed.data;
  if (input.deliveryDate < todayInVN()) {
    return { ok: false as const, errors: { deliveryDate: ["Ngày giao không được ở quá khứ"] }, message: "Ngày giao không hợp lệ" };
  }

  const products = await getProductsByIds(input.items.map((i) => i.id));
  const byId = new Map(products.map((p) => [p.id, p]));
  const lines = input.items
    .map((i) => {
      const p = byId.get(i.id);
      if (!p) return null;
      const unitPrice = effectivePrice(p);
      if (unitPrice <= 0) return null;
      return { productId: p.id, name: p.name, image: p.images[0] ?? null, unitPrice, quantity: i.quantity };
    })
    .filter((l): l is NonNullable<typeof l> => l !== null);

  if (lines.length !== input.items.length) {
    return { ok: false as const, errors: {}, message: "Một số sản phẩm không còn bán hoặc cần liên hệ báo giá. Vui lòng cập nhật giỏ hàng." };
  }

  const subtotal = lines.reduce((s, l) => s + l.unitPrice * l.quantity, 0);
  const { fee, freeThreshold } = shippingConfig();
  const shippingFee = subtotal >= freeThreshold ? 0 : fee;
  const accessToken = randomBytes(24).toString("hex");

  for (let attempt = 0; attempt < 5; attempt++) {
    const code = makeCode();
    try {
      const orderId = await db.transaction(async (tx) => {
        const [res] = await tx.insert(orders).values({
          code,
          accessToken,
          senderName: input.senderName,
          senderPhone: input.senderPhone,
          senderEmail: input.senderEmail || null,
          recipientName: input.recipientName,
          recipientPhone: input.recipientPhone,
          address: input.address,
          city: input.city,
          deliveryDate: input.deliveryDate,
          deliveryTime: input.deliveryTime,
          cardMessage: input.cardMessage || null,
          bannerMessage: input.bannerMessage || null,
          note: input.note || null,
          subtotal,
          shippingFee,
          total: subtotal + shippingFee,
          paymentMethod: input.paymentMethod,
        });
        await tx.insert(orderItems).values(lines.map((l) => ({ ...l, orderId: res.insertId })));
        return res.insertId;
      });
      return { ok: true as const, orderId, code, accessToken };
    } catch (e) {
      if ((e as { cause?: { code?: string } }).cause?.code === "ER_DUP_ENTRY" || (e as { code?: string }).code === "ER_DUP_ENTRY") continue;
      throw e;
    }
  }
  throw new Error("Không tạo được mã đơn hàng");
}

export async function getOrderForCustomer(code: string, token: string) {
  const [order] = await db
    .select()
    .from(orders)
    .where(and(eq(orders.code, code), eq(orders.accessToken, token)))
    .limit(1);
  if (!order) return null;
  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id));
  return { order, items };
}

export async function findOrderByCodeAndPhone(code: string, phoneNumber: string) {
  const normalized = phoneNumber.replace(/[\s.-]/g, "");
  const [order] = await db
    .select({ code: orders.code, accessToken: orders.accessToken, senderPhone: orders.senderPhone, recipientPhone: orders.recipientPhone })
    .from(orders)
    .where(eq(orders.code, code.trim().toUpperCase()))
    .limit(1);
  if (!order || (order.senderPhone !== normalized && order.recipientPhone !== normalized)) return null;
  return order;
}

export function vietQrUrl(amount: number, content: string) {
  const bank = process.env.VIETQR_BANK_ID;
  const account = process.env.VIETQR_ACCOUNT_NO;
  if (!bank || !account) return null;
  const params = new URLSearchParams({ amount: String(amount), addInfo: content, accountName: process.env.VIETQR_ACCOUNT_NAME ?? "" });
  return `https://img.vietqr.io/image/${encodeURIComponent(bank)}-${encodeURIComponent(account)}-compact2.png?${params}`;
}

export const orderStatusLabel: Record<string, string> = {
  pending: "Chờ xác nhận",
  confirmed: "Đã xác nhận",
  delivering: "Đang giao",
  completed: "Hoàn thành",
  cancelled: "Đã hủy",
};

export const paymentStatusLabel: Record<string, string> = {
  unpaid: "Chưa thanh toán",
  paid: "Đã thanh toán",
  refunded: "Đã hoàn tiền",
};
