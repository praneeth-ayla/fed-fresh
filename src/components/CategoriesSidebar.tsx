"use client";

import { Category } from "@prisma/client";
import Link from "next/link";
import AddEditCategoryDialog from "./AddEditCategoryDialog";

export default function CategoriesSidebar({
  categories,
  selectedSlug,
}: {
  categories: Category[];
  selectedSlug: string;
}) {
  return (
    <nav className="border-r-2 border-gray-300 h-full">
      {/* Header */}
      <div className="flex justify-between items-center w-2xs py-2.5 px-4 bg-[#A7A7A7]">
        <h1 className="font-bold">Category</h1>
        <AddEditCategoryDialog mode="add" />
      </div>

      {/* Categories List */}
      <ul className="flex flex-col border-t-2 border-gray-300">
        {categories.map((cat) => (
          <Link
            key={cat.id}
            className={`border-b-2 py-4 px-6 border-gray-300 flex justify-between items-center transition hover:bg-[#D9D9D9]/50 hover:cursor-pointer ${
              selectedSlug === cat.slug ? "font-bold bg-[#D9D9D9]" : ""
            }`}
            href={`/dashboard/menu/${encodeURIComponent(cat.slug)}`}
          >
            {cat.name}
            <AddEditCategoryDialog mode="edit" existing={cat} />
          </Link>
        ))}
      </ul>
    </nav>
  );
}
