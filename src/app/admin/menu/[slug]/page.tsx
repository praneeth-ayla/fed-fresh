import { prisma } from "@/lib/prisma";
import CategoriesSidebar from "@/components/CategoriesSidebar";
import { notFound } from "next/navigation";
import ProductCard from "@/components/ProductCard";

async function getCategories() {
  return prisma.category.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  });
}

async function getProductsByCategory(slug: string) {
  const category = await prisma.category.findUnique({
    where: { slug },
    include: {
      products: {
        include: {
          images: true,
          category: true,
          addons: {
            include: {
              addon: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!category) return null;
  return category;
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const categories = await getCategories();
  const slug = (await params).slug;
  const category = await getProductsByCategory(slug);

  if (!category) return notFound();

  return (
    <div className="flex h-full w-screen">
      <CategoriesSidebar categories={categories} selectedSlug={slug} isAdmin />

      <main className="flex-1 w-full">
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">{category.name} Category</h1>
            <a
              href={`/admin/products/new?category=${category.id}`}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
            >
              Add New Product
            </a>
          </div>
          {category.products && (
            <>
              {category.products.length === 0 ? (
                <p>No products in this category yet.</p>
              ) : (
                <div className="bg-white divide-y divide-gray-200">
                  {category.products.map((product, id) => (
                    <ProductCard product={product} key={id} />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
