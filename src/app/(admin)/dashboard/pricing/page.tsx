import { prisma } from "@/lib/prisma";
import AddEditDiscountDialog from "@/components/AddEditDiscountDialog";
import DiscountCard from "@/components/DiscountCard";

export default async function PricingPage() {
  const [discounts, categories] = await Promise.all([
    prisma.discount.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.category.findMany(),
  ]);

  return (
    <div className="p-8">
      <div className="flex gap-4 mb-6">
        <AddEditDiscountDialog mode="add" categories={categories} />
      </div>

      <h2 className="text-2xl font-semibold mb-4">Discounts</h2>

      <div className="flex gap-6">
        {discounts.map((d) => (
          <DiscountCard categories={categories} discount={d} key={d.id} />
        ))}
      </div>
    </div>
  );
}
