import { prisma } from "@/lib/prisma";
import Link from "next/link";
import ImagesCarousel from "@/components/ImagesCarousel";
import CategoryMenu from "@/components/CategoryMenu";

/**
 * @description ISR (Incremental Static Regeneration) revalidate interval
 * Rebuilds the page every 5 minutes
 */
export const revalidate = 300; // 5 minutes

/**
 * @description Category page component.
 * Fetches a category by slug and lists all active products in that category.
 */
export default async function page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const slug = (await params).slug;

  // Fetch category with active products and their images
  const category = await prisma.category.findUnique({
    where: { slug },
    include: {
      products: {
        where: { isActive: true },
        include: { images: true },
      },
    },
  });

  // Display fallback if category not found
  if (!category) {
    return (
      <p className="text-center mt-10 text-gray-600">Category not found.</p>
    );
  }

  return (
    <main className="max-w-6xl mx-auto py-10 px-4">
      {/* Sidebar category menu */}
      <CategoryMenu />

      {/* Grid of products */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {category.products.map((product) => (
          <Link
            key={product.id}
            href={`/${category.slug}/${product.slug}`}
            className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all"
          >
            {/* Display images carousel if product has images */}
            {product.images[0] && <ImagesCarousel images={product.images} />}

            {/* Product details */}
            <div className="p-4">
              <h2 className="font-semibold">{product.name}</h2>
              <p className="text-sm text-gray-500 mb-2">
                £{(product.basePricePence / 100).toFixed(2)}
              </p>
              <p className="text-sm text-gray-600 line-clamp-2">
                {product.description}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
