"use server";

import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function CategoryMenu({
  currentSlug,
}: {
  currentSlug?: string;
}) {
  const categories = await prisma.category.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  });

  return (
    <main className="flex gap-4 flex-wrap justify-center">
      {categories.map((cat) => {
        const isSelected = cat.slug === currentSlug;

        return (
          <Link
            key={cat.id}
            href={`/menu/${cat.slug}`}
            className={`px-8 py-3 text-white rounded-lg text-2xl transition-all duration-200 ${
              isSelected
                ? "bg-accent hover:bg-accent/90"
                : "bg-primary hover:bg-primary/90"
            }`}
          >
            {cat.name}
          </Link>
        );
      })}
    </main>
  );
}
