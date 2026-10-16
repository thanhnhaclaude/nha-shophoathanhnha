import { NextResponse, after, type NextRequest } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { db, orders } from "@/lib/db";
import { sendPaidEmails } from "@/lib/mailer";
import { orderPrefix } from "@/lib/orders";

export const dynamic = "force-dynamic";

/**
 * Webhook SePay (https://docs.sepay.vn): SePay gọi vào đây mỗi khi tài khoản VCB có giao dịch.
 * Cấu hình trên my.sepay.vn → Webhooks:
 *   URL: https://<tên miền>/api/sepay/webhook/  · Kiểu chứng thực: API Key  · Key = SEPAY_API_KEY
 * Nội dung chuyển khoản chứa mã đơn (vd. TN123456, tiền tố theo ORDER_CODE_PREFIX) → đơn đủ tiền được đánh dấu "Đã thanh toán".
 */
type SepayPayload = {
  id: number;
  transferType: "in" | "out";
  transferAmount: number;
  content?: string | null;
  code?: string | null;
  description?: string | null;
};

function authorized(req: NextRequest) {
  const key = process.env.SEPAY_API_KEY;
  if (!key) return false;
  const got = Buffer.from(req.headers.get("authorization") ?? "");
  const want = Buffer.from(`Apikey ${key}`);
  return got.length === want.length && timingSafeEqual(got, want);
}

export async function POST(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ success: false }, { status: 401 });

  let body: SepayPayload;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, message: "invalid json" }, { status: 400 });
  }

  // Luôn trả 200 cho giao dịch không liên quan để SePay không gửi lại nhiều lần
  if (body.transferType !== "in" || !(body.transferAmount > 0)) return NextResponse.json({ success: true, matched: false });

  const text = `${body.code ?? ""} ${body.content ?? ""} ${body.description ?? ""}`.toUpperCase();
  const prefix = orderPrefix();
  const code = text.match(new RegExp(`${prefix}\\s?(\\d{6})(?!\\d)`))?.[1];
  if (!code) return NextResponse.json({ success: true, matched: false });

  const [order] = await db.select().from(orders).where(eq(orders.code, `${prefix}${code}`)).limit(1);
  if (!order) return NextResponse.json({ success: true, matched: false });
  if (order.paymentStatus === "paid") return NextResponse.json({ success: true, matched: true, already: true });

  if (body.transferAmount < order.total) {
    const note = `[SePay #${body.id}] Nhận ${body.transferAmount.toLocaleString("vi-VN")}đ, thiếu so với tổng ${order.total.toLocaleString("vi-VN")}đ`;
    await db
      .update(orders)
      .set({ adminNote: order.adminNote ? `${order.adminNote}\n${note}` : note })
      .where(eq(orders.id, order.id));
    return NextResponse.json({ success: true, matched: true, paid: false });
  }

  const [res] = await db
    .update(orders)
    .set({ paymentStatus: "paid", status: order.status === "pending" ? "confirmed" : order.status })
    .where(and(eq(orders.id, order.id), eq(orders.paymentStatus, "unpaid")));
  if (res.affectedRows > 0) after(() => sendPaidEmails(order.id, body.transferAmount));

  return NextResponse.json({ success: true, matched: true, paid: true });
}
