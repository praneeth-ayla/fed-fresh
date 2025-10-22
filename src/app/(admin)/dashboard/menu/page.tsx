import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export default async function page() {
  const firstCategory = await prisma.category.findFirst({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  });

  if (firstCategory) {
    redirect(`/dashboard/menu/${firstCategory.slug}`);
  }

  return <p>No categories found.</p>;
}
