import "server-only";
import type { Metadata } from "next";
import { eq } from "drizzle-orm";
import { db, seoMeta } from "./db";
import { site } from "./site";

/** Đường dẫn chuẩn có dấu "/" cuối, giống WordPress cũ. */
export function canonicalPath(slug?: string) {
  return slug ? `/${slug}/` : "/";
}

/**
 * Metadata cho một đường dẫn: ưu tiên tiêu đề / mô tả / robots chép từ website cũ (bảng seo_meta),
 * thiếu thì dùng giá trị mặc định truyền vào.
 */
export async function seoMetadata(path: string, fallback: { title: string; description?: string; noindex?: boolean } & Metadata): Promise<Metadata> {
  const [row] = await db.select().from(seoMeta).where(eq(seoMeta.path, path)).limit(1);
  const { title, description, noindex, ...rest } = fallback;
  const noIndex = row?.robots ? /noindex/i.test(row.robots) : noindex;
  // Bỏ mô tả mặc định vô nghĩa của WordPress (vd. "Sản phẩm Archive")
  const oldDesc = row?.description && !/\barchive\b/i.test(row.description) ? row.description : null;
  const desc = shortDescription(oldDesc || description);
  // Tiêu đề cũ đã gồm " | Hoa Thanh Nhã" nên dùng nguyên văn
  const fullTitle = row?.title || `${title} | ${site.name}`;
  return {
    ...rest,
    title: row?.title ? { absolute: row.title } : title,
    description: desc,
    alternates: { canonical: path, ...rest.alternates },
    // Ghi đầy đủ thẻ chia sẻ (Facebook, Zalo…) cho mọi trang; openGraph của trang con thay thế hoàn toàn của layout
    openGraph: {
      type: "website",
      locale: "vi_VN",
      siteName: site.name,
      images: [DEFAULT_OG_IMAGE],
      ...rest.openGraph,
      title: fullTitle,
      description: desc,
      url: path,
    } as Metadata["openGraph"],
    twitter: { card: "summary_large_image", title: fullTitle, description: desc },
    robots: noIndex ? { index: false, follow: true } : rest.robots,
  };
}

const DEFAULT_OG_IMAGE = "/brand/banner2.webp";

/** Google chỉ hiển thị ~160 ký tự mô tả: cắt gọn tại ranh giới từ (mô tả cũ của một số trang dài hơn 3.000 ký tự). */
function shortDescription(text: string | null | undefined, max = 160) {
  const t = (text ?? "").replace(/\s+/g, " ").trim();
  if (!t) return undefined;
  if (t.length <= max) return t;
  const cut = t.slice(0, max - 1);
  const i = cut.lastIndexOf(" ");
  return `${(i > 100 ? cut.slice(0, i) : cut).replace(/[\s,.;:–-]+$/, "")}…`;
}

/**
 * Trang phân trang (?page=2…): canonical trỏ về chính trang đó và tiêu đề có " - Trang N",
 * để Google index được sản phẩm ở các trang sau và không báo trùng tiêu đề với trang 1.
 */
export function paginated(meta: Metadata, path: string, page: number): Metadata {
  if (page <= 1) return meta;
  const label = ` - Trang ${page}`;
  const t = meta.title;
  let title = meta.title;
  if (typeof t === "string") title = t + label;
  else if (t && typeof t === "object" && "absolute" in t) {
    const i = t.absolute.lastIndexOf(" | ");
    title = { absolute: i > 0 ? t.absolute.slice(0, i) + label + t.absolute.slice(i) : t.absolute + label };
  }
  return { ...meta, title, alternates: { ...meta.alternates, canonical: `${path}?page=${page}` } };
}
