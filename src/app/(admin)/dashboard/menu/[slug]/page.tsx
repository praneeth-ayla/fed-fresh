import { prisma } from "@/lib/prisma";
import CategoriesSidebar from "@/components/CategoriesSidebar";
import { notFound } from "next/navigation";
import ProductCardAdmin from "@/components/ProductCardAdmin";
import AddEditProductDialog from "@/components/AddEditProductDialog";
import { Button } from "@/components/ui/button";

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
          addons: true,
        },
        orderBy: { name: "desc" },
      },
    },
  });

  if (!category) return null;
  return category;
}

export default async function page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const categories = await getCategories();
  const slug = (await params).slug;
  const category = await getProductsByCategory(slug);

  if (!category) return notFound();

  return (
    <div className="flex flex-1 h-full w-full">
      <CategoriesSidebar categories={categories} selectedSlug={slug} />

      <main className="flex-1 min-h-0 overflow-auto w-full">
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">{category.name} Category</h1>
            <AddEditProductDialog categoryId={category.id}>
              <Button className="bg-admin-btn hover:bg-admin-btn/50 hover:cursor-pointer font-bold text-base px-8 py-5">
                Add New Product
              </Button>
            </AddEditProductDialog>
          </div>

          {category.products && (
            <>
              {category.products.length === 0 ? (
                <p>No products in this category yet.</p>
              ) : (
                <div className="flex flex-col gap-10 mb-10">
                  {category.products.map((product, id) => (
                    <div
                      key={id}
                      className="border-b-2 border-[#9A9A9A] pb-10 last:border-b-2"
                    >
                      <ProductCardAdmin product={product} />
                    </div>
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
