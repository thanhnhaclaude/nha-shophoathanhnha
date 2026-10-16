import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { findOrderByCodeAndPhone, orderPrefix } from "@/lib/orders";

export const metadata: Metadata = { title: "Tra cứu đơn hàng" };
export const dynamic = "force-dynamic";

async function lookup(formData: FormData) {
  "use server";
  const code = String(formData.get("code") ?? "");
  const phone = String(formData.get("phone") ?? "");
  const order = code && phone ? await findOrderByCodeAndPhone(code, phone) : null;
  if (!order) redirect("/tra-cuu-don-hang/?err=1");
  redirect(`/don-hang/${order.code}/?t=${order.accessToken}`);
}

export default async function LookupPage({ searchParams }: PageProps<"/tra-cuu-don-hang">) {
  const { err } = await searchParams;
  return (
    <div className="container-x max-w-lg py-14">
      <h1 className="heading-display text-4xl">Tra cứu đơn hàng</h1>
      <p className="mt-2 text-muted">Nhập mã đơn (ví dụ {orderPrefix()}123456) và số điện thoại người đặt hoặc người nhận.</p>
      <form action={lookup} className="mt-8 space-y-4 rounded-3xl border border-border bg-surface p-6">
        <div>
          <label htmlFor="code" className="label">
            Mã đơn hàng
          </label>
          <input id="code" name="code" required className="field uppercase" autoComplete="off" />
        </div>
        <div>
          <label htmlFor="phone" className="label">
            Số điện thoại
          </label>
          <input id="phone" name="phone" type="tel" required className="field" />
        </div>
        {err && (
          <p className="text-sm text-danger" role="alert">
            Không tìm thấy đơn hàng phù hợp. Vui lòng kiểm tra lại.
          </p>
        )}
        <button className="btn-primary h-12 w-full">Tra cứu</button>
      </form>
    </div>
  );
}
