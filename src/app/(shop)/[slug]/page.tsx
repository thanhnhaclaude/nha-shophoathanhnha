import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Camera, Gift, Phone, ShieldCheck, Truck } from "lucide-react";
import { AddToCart } from "@/components/add-to-cart";
import { Breadcrumbs, Pagination, SortBar, parseListingParams } from "@/components/listing";
import { ProductGallery } from "@/components/product-gallery";
import { ProductCard, ProductGrid } from "@/components/product-card";
import { ZaloIcon } from "@/components/icons";
import { effectivePrice, formatVND } from "@/lib/format";
import { infoPages, type InfoPage } from "@/lib/info-pages";
import { mainMenu } from "@/lib/menu";
import { PostCard } from "@/components/post-card";
import { ReadMore } from "@/components/read-more";
import { WishlistButton } from "@/components/wishlist";
import Link from "next/link";
import type { Page, PostCategory } from "@/lib/db/schema";
import {
  getCategoryBySlug,
  getPageBySlug,
  getPostCategoriesWithCounts,
  getPostCategoryBySlug,
  getPostsInCategory,
  getPrimaryPostCategory,
  getProductBySlug,
  getProductCardsBySlugs,
  getProductsInCategory,
  getRecentPosts,
  getRelatedProducts,
} from "@/lib/queries";
import { canonicalPath, paginated, seoMetadata } from "@/lib/seo";
import { cleanHtml, normalizeHeadings, plainText, removeDuplicateTitleHeading, splitProductBlocks } from "@/lib/sanitize";
import { site } from "@/lib/site";

export const dynamic = "force-dynamic";

type Props = PageProps<"/[slug]">;

/**
 * Như WordPress cũ: khi bài viết trùng slug với danh mục sản phẩm (vd. shop-hoa-tuoi-quan-10),
 * URL đó hiển thị danh mục chứ không phải bài viết.
 */
async function getVisibleCms(slug: string) {
  const cms = await getPageBySlug(slug);
  if (cms?.type === "post" && (await getCategoryBySlug(slug))) return null;
  return cms;
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { page } = parseListingParams(await searchParams);
  const path = canonicalPath(slug);
  const cms = await getVisibleCms(slug);
  if (cms) {
    return seoMetadata(path, {
      title: cms.title,
      description: plainText(cms.excerpt || cms.content) || site.description,
      openGraph: cms.image ? { type: cms.type === "post" ? "article" : "website", images: [cms.image] } : undefined,
    });
  }
  const info = infoPages[slug];
  if (info) return seoMetadata(path, { title: info.title, description: info.description });
  const found = await getProductBySlug(slug);
  if (found) {
    const { product } = found;
    return seoMetadata(path, {
      title: product.name,
      description: plainText(product.shortDescription || product.description) || site.description,
      openGraph: product.images.length ? { images: product.images.slice(0, 1) } : undefined,
    });
  }
  const category = await getCategoryBySlug(slug);
  if (category) {
    return paginated(await seoMetadata(path, {
      title: category.name,
      description: plainText(category.description) || `${category.name} tại Shop hoa tươi Thanh Nhã. Giao hoa hỏa tốc, miễn phí thiệp & băng rôn.`,
    }), path, page);
  }
  const postCategory = await getPostCategoryBySlug(slug);
  if (postCategory) return paginated(await seoMetadata(path, { title: postCategory.name, description: plainText(postCategory.description) || `${postCategory.name}: kinh nghiệm chọn hoa, ý nghĩa các loài hoa và địa chỉ shop hoa tươi Thanh Nhã giao hoa tận nơi.` }), path, page);
  return {};
}

export default async function SlugPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const cms = await getVisibleCms(slug);
  if (cms) return <CmsView page={cms} />;
  const info = infoPages[slug];
  if (info) return <InfoView page={info} />;
  const found = await getProductBySlug(slug);
  if (found) return <ProductView data={found} />;

  const category = await getCategoryBySlug(slug);
  if (!category) {
    const postCategory = await getPostCategoryBySlug(slug);
    if (!postCategory) notFound();
    return <PostArchiveView category={postCategory} page={parseListingParams(await searchParams).page} />;
  }

  const { page, sort } = parseListingParams(await searchParams);
  const { items, total, pages } = await getProductsInCategory(category, { page, sort });
  const group = mainMenu.find((g) => g.slug === slug || g.children.some((c) => c.slug === slug));
  const base = `/${category.slug}/`;

  return (
    <div className="container-x py-8">
      <Breadcrumbs items={[...(group && group.slug !== slug ? [{ label: group.label, href: `/${group.slug}/` }] : []), { label: category.name }]} />
      <header className="mt-6 max-w-3xl">
        <h1 className="heading-display text-4xl sm:text-5xl">{category.name}</h1>
        {category.description && <p className="mt-3 text-muted">{plainText(category.description, 300)}</p>}
      </header>
      {group && (
        <nav aria-label="Danh mục liên quan" className="-mx-4 mt-6 overflow-x-auto px-4">
          <ul className="flex gap-2 pb-1">
            {group.children.map((c) => (
              <li key={c.slug} className="shrink-0">
                <a
                  href={`/${c.slug}/`}
                  aria-current={c.slug === slug ? "page" : undefined}
                  className={`block rounded-full px-4 py-2 text-sm ${c.slug === slug ? "bg-brand text-white" : "bg-surface ring-1 ring-border hover:ring-brand"}`}
                >
                  {c.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      )}
      <div className="mt-8">
        <SortBar base={base} sort={sort} total={total} />
      </div>
      <div className="mt-6">
        {items.length ? (
          <ProductGrid products={items} priorityCount={5} />
        ) : (
          <p className="rounded-2xl bg-surface p-10 text-center text-muted">
            Danh mục đang được cập nhật. Gọi <a className="font-semibold text-brand-strong" href={`tel:${site.phone}`}>{site.phoneDisplay}</a> để được tư vấn mẫu.
          </p>
        )}
      </div>
      <Pagination base={base} page={page} pages={pages} sort={sort} />
      {category.description && plainText(category.description, 10000).length > 300 && (
        <section aria-label={`Giới thiệu ${category.name}`} className="mx-auto mt-16 max-w-3xl border-t border-border pt-10">
          <ReadMore html={cleanHtml(removeDuplicateTitleHeading(category.description, category.name))} />
        </section>
      )}
    </div>
  );
}

/** Chọn số cột để hàng cuối không bị hụt (vd. 8 sản phẩm -> 4 cột, 6 hoặc 9 -> 3 cột). */
function productGridCols(count: number) {
  return count % 4 !== 0 && count % 3 === 0 ? "md:grid-cols-3" : "md:grid-cols-4";
}

async function PostArchiveView({ category, page }: { category: PostCategory; page: number }) {
  const [{ items, pages, total }, allCats] = await Promise.all([getPostsInCategory(category.id, { page }), getPostCategoriesWithCounts()]);
  const base = canonicalPath(category.slug);
  const link = (n: number) => (n === 1 ? base : `${base}?page=${n}`);
  return (
    <div className="container-x py-10">
      <Breadcrumbs items={[{ label: category.name }]} />
      <h1 className="heading-display mt-6 text-4xl sm:text-5xl">{category.name}</h1>
      {category.description && <p className="mt-3 max-w-3xl text-muted">{plainText(category.description, 300)}</p>}
      {allCats.length > 1 && (
        <nav aria-label="Danh mục bài viết" className="-mx-4 mt-6 overflow-x-auto px-4">
          <ul className="flex gap-2 pb-1">
            {allCats.map((c) => (
              <li key={c.slug} className="shrink-0">
                <Link
                  href={canonicalPath(c.slug)}
                  aria-current={c.id === category.id ? "page" : undefined}
                  className={`block rounded-full px-4 py-2 text-sm ${c.id === category.id ? "bg-brand text-white" : "bg-surface ring-1 ring-border hover:ring-brand"}`}
                >
                  {c.name} <span className="opacity-70">({c.count})</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
      <p className="mt-6 text-sm text-muted">{total} bài viết</p>
      {items.length === 0 ? (
        <p className="mt-8 rounded-2xl bg-surface p-10 text-center text-muted">Chưa có bài viết.</p>
      ) : (
        <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((p) => (
            <li key={p.id}>
              <PostCard post={{ ...p, excerptText: plainText(p.excerpt, 150) }} />
            </li>
          ))}
        </ul>
      )}
      {pages > 1 && (
        <nav aria-label="Phân trang" className="mt-10 flex items-center justify-center gap-3 text-sm">
          {page > 1 && (
            <Link href={link(page - 1)} className="btn-outline h-11">
              Bài mới hơn
            </Link>
          )}
          <span className="text-muted">
            Trang {page}/{pages}
          </span>
          {page < pages && (
            <Link href={link(page + 1)} className="btn-outline h-11">
              Bài cũ hơn
            </Link>
          )}
        </nav>
      )}
    </div>
  );
}

async function CmsView({ page }: { page: Page }) {
  const isPost = page.type === "post";
  const [recent, postCategory, segments] = await Promise.all([
    isPost ? getRecentPosts(page.id) : Promise.resolve([]),
    isPost ? getPrimaryPostCategory(page.id) : Promise.resolve(null),
    Promise.all(
      splitProductBlocks(normalizeHeadings(removeDuplicateTitleHeading(page.content, page.title))).map(async (seg) =>
        seg.type === "html" ? seg : { type: "products" as const, products: await getProductCardsBySlugs(seg.slugs) },
      ),
    ),
  ]);
  const jsonLd = isPost
    ? {
        "@context": "https://schema.org",
        "@type": "Article",
        headline: page.title,
        image: page.image ? [page.image] : undefined,
        datePublished: page.publishedAt.toISOString(),
        dateModified: page.updatedAt.toISOString(),
        publisher: { "@type": "Organization", name: site.name },
      }
    : null;
  return (
    <div className="container-x max-w-3xl py-10">
      {jsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />}
      <Breadcrumbs items={[...(postCategory ? [{ label: postCategory.name, href: canonicalPath(postCategory.slug) }] : []), { label: page.title }]} />
      <h1 className="heading-display mt-6 text-[1.875rem] leading-tight sm:text-4xl lg:text-5xl">{page.title}</h1>
      {isPost && (
        <p className="mt-3 text-sm text-muted">
          <time dateTime={page.publishedAt.toISOString()}>{page.publishedAt.toLocaleDateString("vi-VN")}</time>
        </p>
      )}
      <article className="mt-8 space-y-8">
        {segments.map((seg, i) =>
          seg.type === "html" ? (
            <div key={i} className="prose-shop" dangerouslySetInnerHTML={{ __html: cleanHtml(seg.html, { normalize: false }) }} />
          ) : (
            <div key={i} className={`grid grid-cols-2 gap-3 sm:gap-4 lg:-mx-24 ${productGridCols(seg.products.length)}`}>
              {seg.products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          ),
        )}
      </article>
      {recent.length > 0 && (
        <section aria-labelledby="recent-h" className="mt-16 border-t border-border pt-10">
          <h2 id="recent-h" className="heading-display text-3xl">
            Bài viết khác
          </h2>
          <ul className="mt-6 grid gap-5 sm:grid-cols-3">
            {recent.map((p) => (
              <li key={p.id}>
                <PostCard post={p} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function InfoView({ page }: { page: InfoPage }) {
  return (
    <div className="container-x max-w-3xl py-10">
      <Breadcrumbs items={[{ label: page.title }]} />
      <h1 className="heading-display mt-6 text-4xl sm:text-5xl">{page.title}</h1>
      <div className="mt-8 space-y-8">
        {page.sections.map((s, i) => (
          <section key={s.heading ?? i}>
            {s.heading && <h2 className="font-display text-2xl font-semibold">{s.heading}</h2>}
            <div className="mt-3 space-y-2 leading-relaxed text-muted">
              {s.body.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

async function ProductView({ data }: { data: NonNullable<Awaited<ReturnType<typeof getProductBySlug>>> }) {
  const { product, categories } = data;
  const price = effectivePrice(product);
  const onSale = price < product.price;
  const related = await getRelatedProducts(product.id, categories.map((c) => c.id));
  const primaryCat = categories.find((c) => c.parentId != null) ?? categories[0];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    image: product.images,
    sku: product.sku ?? undefined,
    description: plainText(product.shortDescription || product.description, 300),
    brand: { "@type": "Brand", name: site.name },
    offers:
      price > 0
        ? { "@type": "Offer", priceCurrency: "VND", price, availability: "https://schema.org/InStock", url: `${site.url}/${product.slug}/` }
        : undefined,
  };

  return (
    <div className="container-x py-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <Breadcrumbs items={[...(primaryCat ? [{ label: primaryCat.name, href: `/${primaryCat.slug}/` }] : []), { label: product.name }]} />

      <div className="mt-6 grid gap-8 lg:grid-cols-2 lg:gap-14">
        <ProductGallery images={product.images} name={product.name} />

        <div className="flex flex-col gap-6">
          <div>
            {product.sku && <p className="text-xs uppercase tracking-widest text-muted">Mã: {product.sku}</p>}
            <h1 className="heading-display mt-2 text-3xl leading-tight sm:text-4xl">{product.name}</h1>
            <div className="mt-4 flex flex-wrap items-baseline gap-3">
              {price > 0 ? (
                <>
                  <span className="text-3xl font-semibold text-brand-strong">{formatVND(price)}</span>
                  {onSale && <span className="text-lg text-muted line-through">{formatVND(product.price)}</span>}
                </>
              ) : (
                <span className="text-2xl font-semibold text-leaf">Liên hệ để báo giá</span>
              )}
            </div>
          </div>

          {product.shortDescription && (
            <div className="prose-shop text-[15px] text-muted" dangerouslySetInnerHTML={{ __html: cleanHtml(product.shortDescription) }} />
          )}

          {price > 0 ? (
            <AddToCart product={{ id: product.id, slug: product.slug, name: product.name, image: product.images[0] ?? null, price }} />
          ) : null}
          <WishlistButton item={{ id: product.id, slug: product.slug, name: product.name, image: product.images[0] ?? null, price }} />

          <div className="grid gap-3 sm:grid-cols-2">
            <a href={`tel:${site.phone}`} className="btn-leaf h-12">
              <Phone className="size-4" aria-hidden /> Gọi {site.phoneDisplay}
            </a>
            <a href={site.zalo} target="_blank" rel="noopener noreferrer" className="btn-outline h-12">
              <ZaloIcon className="size-5 rounded" /> Tư vấn qua Zalo
            </a>
          </div>

          <ul className="grid gap-3 rounded-2xl bg-surface-muted p-5 text-sm sm:grid-cols-2">
            <li className="flex gap-3">
              <Truck className="size-5 shrink-0 text-brand-strong" aria-hidden /> Giao hỏa tốc 60–90 phút
            </li>
            <li className="flex gap-3">
              <Gift className="size-5 shrink-0 text-brand-strong" aria-hidden /> Tặng thiệp & băng rôn miễn phí
            </li>
            <li className="flex gap-3">
              <Camera className="size-5 shrink-0 text-brand-strong" aria-hidden /> Chụp ảnh hoa trước khi giao
            </li>
            <li className="flex gap-3">
              <ShieldCheck className="size-5 shrink-0 text-brand-strong" aria-hidden /> Không đúng mẫu – không thanh toán
            </li>
          </ul>
        </div>
      </div>

      {product.description && (
        <section aria-labelledby="desc-h" className="mx-auto mt-16 max-w-3xl">
          <h2 id="desc-h" className="heading-display text-3xl">
            Mô tả sản phẩm
          </h2>
          <div className="prose-shop mt-6" dangerouslySetInnerHTML={{ __html: cleanHtml(removeDuplicateTitleHeading(product.description, product.name)) }} />
        </section>
      )}

      {related.length > 0 && (
        <section aria-labelledby="rel-h" className="mt-16">
          <h2 id="rel-h" className="heading-display text-3xl">
            Có thể bạn cũng thích
          </h2>
          <div className="mt-6">
            <ProductGrid products={related.slice(0, 5)} />
          </div>
        </section>
      )}
    </div>
  );
}
