import { NextResponse, type NextRequest } from "next/server";

const LOGIN_PATH = "/admin/login/";

export function proxy(request: NextRequest) {
  const { pathname: rawPath } = request.nextUrl;

  // SEO: đường dẫn có chữ hoa (vd. /HOA-BO/) là bản trùng của /hoa-bo/ -> chuyển hướng 301 về chữ thường.
  // Bỏ qua file tĩnh (có phần mở rộng) vì tên ảnh có thể có chữ hoa.
  if (/[A-Z]/.test(rawPath) && !/\.[a-z0-9]+$/i.test(rawPath)) {
    const url = request.nextUrl.clone();
    url.pathname = rawPath.toLowerCase();
    return NextResponse.redirect(url, 301);
  }

  // Kiểm tra nhanh: chưa có cookie phiên thì chuyển tới trang đăng nhập.
  // Việc xác thực thật sự nằm ở requireAdmin() trong từng trang/action.
  // URL có dấu "/" cuối (trailingSlash) -> so sánh sau khi bỏ dấu "/" để không lặp chuyển hướng
  const pathname = rawPath.replace(/\/+$/, "");
  if (pathname.startsWith("/admin") && pathname !== "/admin/login" && !request.cookies.has("htn_admin")) {
    return NextResponse.redirect(new URL(LOGIN_PATH, request.url));
  }
  return NextResponse.next();
}

export const config = { matcher: ["/((?!_next/|api/|media/|uploads/|brand/).*)"] };
