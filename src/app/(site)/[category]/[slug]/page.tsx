import { prisma } from "@/lib/prisma";
import ProductClient from "./ProductClient";

/**
 * @description Product page for a single product under a category.
 * Fetches product details from Prisma and renders the client component.
 *
 * @param params - Object containing the category slug and product slug from the URL
 */
export default async function page({
  params,
}: {
  params: Promise<{ category: string; slug: string }>;
}) {
  const { category, slug } = await params;

  // Fetch the product with associated images, addons, and category
  const product = await prisma.product.findFirst({
    where: {
      slug: slug,
      category: { slug: category },
      isActive: true,
    },
    include: {
      images: true,
      addons: true,
      category: true,
    },
  });

  if (!product) {
    return (
      <div className="max-w-5xl mx-auto py-10 text-center text-gray-600">
        Product not found
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-10">
      <ProductClient product={product} />
    </div>
  );
}
