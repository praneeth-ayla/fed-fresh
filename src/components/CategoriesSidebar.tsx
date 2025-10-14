"use client";

import { Category } from "@prisma/client";
import Link from "next/link";
import AddEditCategoryDialog from "./AddEditCategoryDialog";

export default function CategoriesSidebar({
  categories,
  isAdmin = false,
  selectedSlug,
}: {
  categories: Category[];
  isAdmin?: boolean;
  selectedSlug: string;
}) {
  return (
    <nav className="border-r-2 h-full">
      {/* Header */}
      <div className="flex justify-between items-center w-2xs py-2.5 px-4">
        <h1 className="font-bold ml-4">Category</h1>
        {isAdmin && <AddEditCategoryDialog mode="add" />}
      </div>

      {/* Categories List */}
      <ul className="flex flex-col border-t-2">
        {categories.map((cat) => (
          <li
            key={cat.id}
            className={`border-b-2 py-4 px-6 border-gray-200 flex justify-between items-center transition hover:bg-gray-50 ${
              selectedSlug === cat.slug ? "font-bold bg-gray-100" : ""
            }`}
          >
            <Link
              href={
                isAdmin
                  ? `/admin/menu/${encodeURIComponent(cat.slug)}`
                  : `/menu/${encodeURIComponent(cat.slug)}`
              }
              className="flex-1 truncate"
            >
              {cat.name}
            </Link>

            {isAdmin && <AddEditCategoryDialog mode="edit" existing={cat} />}
          </li>
        ))}
      </ul>
    </nav>
  );
}
