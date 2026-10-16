import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/listing";
import { WishlistView } from "@/components/wishlist";
import { seoMetadata } from "@/lib/seo";

// Đọc tiêu đề SEO từ CSDL khi có yêu cầu (không cần CSDL lúc build)
export const dynamic = "force-dynamic";

export function generateMetadata(): Promise<Metadata> {
  return seoMetadata("/danh-sach/", { title: "Danh sách yêu thích", noindex: true });
}

export default function WishlistPage() {
  return (
    <div className="container-x py-10">
      <Breadcrumbs items={[{ label: "Danh sách yêu thích" }]} />
      <h1 className="heading-display mt-6 text-4xl sm:text-5xl">Danh sách yêu thích</h1>
      <WishlistView />
    </div>
  );
}
