import { prisma } from "@/lib/prisma";
import CategoryMenu from "@/components/CategoryMenu";
import ProductCard from "@/components/ProductCard";
import { unstable_cache } from "next/cache";

// Rebuild this page every 5 minutes
export const revalidate = 300;

const getCategory = unstable_cache(
  async (slug: string) => {
    return prisma.category.findUnique({
      where: { slug },
      include: {
        products: {
          where: { isActive: true },
          include: { images: true },
        },
      },
    });
  },
  ["categories"], // cache key
  { revalidate: 300, tags: ["categories"] }
);

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const category = await getCategory(slug);

  if (!category) {
    return (
      <p className="text-center mt-10 text-gray-600">Category not found.</p>
    );
  }

  return (
    <main>
      {/* Category */}
      <div className="py-8">
        <CategoryMenu currentSlug={slug} />
      </div>

      {/* Product grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {category.products.map((product) => (
          <ProductCard
            key={product.id}
            categorySlug={category.slug}
            product={product}
          />
        ))}
      </div>
    </main>
  );
}
