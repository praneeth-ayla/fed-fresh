"use server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

/**
 * Adds a new category to the database.
 */
export async function addCategory(formData: FormData) {
  const name = formData.get("name") as string;
  const description = (formData.get("description") as string) || "";
  const sortOrder = Number(formData.get("sortOrder")) || 0;

  if (!name) throw new Error("Category name is required");

  const slug = name.toLowerCase().replace(/\s+/g, "-");

  await prisma.category.create({
    data: { name, description, slug, sortOrder },
  });

  revalidatePath(`/menu/${slug}`);
  revalidatePath("/dashboard/menu");
}

/**
 * Updates an existing category in the database.
 */
export async function updateCategory(formData: FormData) {
  const id = Number(formData.get("id"));
  const name = formData.get("name") as string;
  const description = (formData.get("description") as string) || "";
  const sortOrder = Number(formData.get("sortOrder")) || 0;

  if (!id || !name) throw new Error("Invalid category data");

  const slug = name.toLowerCase().replace(/\s+/g, "-");

  const updated = await prisma.category.update({
    where: { id },
    data: { name, description, slug, sortOrder },
  });

  revalidatePath("/dashboard/menu");
  revalidatePath("/menu");
  revalidatePath(`/menu/${slug}`);

  return updated;
}

/**
 * Deletes a category from the database.
 */
export async function deleteCategory(id: number) {
  if (!id) throw new Error("Category ID is required for deletion");

  await prisma.category.delete({ where: { id } });

  revalidatePath("/dashboard/menu");
}
