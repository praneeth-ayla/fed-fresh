import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

/**
 * @description Menu landing page.
 * Fetches the first active category and redirects to its page.
 * If no category is found, shows a fallback message.
 */
export default async function page() {
  // Fetch the first active category based on sort order
  const firstCategory = await prisma.category.findFirst({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  });

  // Redirect to the first category if it exists
  if (firstCategory) {
    redirect(`/menu/${firstCategory.slug}`);
  }

  // Fallback UI if no categories exist
  return (
    <p className="text-center mt-10 text-gray-600">No categories found.</p>
  );
}
