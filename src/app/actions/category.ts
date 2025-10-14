"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// CREATE
export async function addCategory(formData: FormData) {
  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const sortOrder = Number(formData.get("sortOrder")) || 0;
  const slug = name.toLowerCase().replace(/\s+/g, "-");

  if (!name) throw new Error("Category name is required");

  await prisma.category.create({
    data: { name, description, slug, sortOrder },
  });

  revalidatePath("/admin/menu");
}

// UPDATE
export async function updateCategory(formData: FormData) {
  const id = Number(formData.get("id"));
  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const sortOrder = Number(formData.get("sortOrder")) || 0;

  if (!id || !name) throw new Error("Invalid category data");

  const slug = name.toLowerCase().replace(/\s+/g, "-");

  const updated = await prisma.category.update({
    where: { id },
    data: { name, description, slug, sortOrder },
  });

  revalidatePath("/admin/menu");
  return updated;
}

// DELETE
export async function deleteCategory(id: number) {
  await prisma.category.delete({ where: { id } });
  revalidatePath("/admin/menu");
}
