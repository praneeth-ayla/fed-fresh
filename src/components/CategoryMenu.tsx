"use server";

import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function CategoryMenu() {
  const categories = await prisma.category.findMany({
    where: { isActive: true },
    orderBy: {
      sortOrder: "asc",
    },
  });

  return (
    <main className="max-w-5xl mx-auto py-10 px-4">
      <div className="flex gap-3 mb-8">
        {categories.map((cat) => (
          <Link
            key={cat.id}
            href={`/menu/${cat.slug}`}
            className="px-4 py-2 rounded-md bg-green-200 hover:bg-green-300 text-sm font-medium"
          >
            {cat.name}
          </Link>
        ))}
      </div>
    </main>
  );
}
