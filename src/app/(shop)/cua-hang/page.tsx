import type { Metadata } from "next";
import { Breadcrumbs, Pagination, SortBar, parseListingParams } from "@/components/listing";
import { ProductGrid } from "@/components/product-card";
import { getAllProducts } from "@/lib/queries";
import { paginated, seoMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export async function generateMetadata({ searchParams }: PageProps<"/cua-hang">): Promise<Metadata> {
  const { page } = parseListingParams(await searchParams);
  return paginated(await seoMetadata("/cua-hang/", { title: "Cửa hàng", description: "Tất cả mẫu hoa tươi tại Shop hoa Thanh Nhã." }), "/cua-hang/", page);
}

export default async function ShopPage({ searchParams }: PageProps<"/cua-hang">) {
  const { page, sort } = parseListingParams(await searchParams);
  const { items, total, pages } = await getAllProducts({ page, sort });
  return (
    <div className="container-x py-8">
      <Breadcrumbs items={[{ label: "Cửa hàng" }]} />
      <h1 className="heading-display mt-6 text-4xl sm:text-5xl">Cửa hàng</h1>
      <div className="mt-8">
        <SortBar base="/cua-hang/" sort={sort} total={total} />
      </div>
      <div className="mt-6">
        <ProductGrid products={items} priorityCount={5} />
      </div>
      <Pagination base="/cua-hang/" page={page} pages={pages} sort={sort} />
    </div>
  );
}
