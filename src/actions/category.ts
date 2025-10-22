"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

/**
 * @file actions/category.ts
 * @description Server-side actions for managing categories in the admin dashboard.
 * Includes functions to create, update, and delete categories.
 * Uses Prisma ORM and Next.js cache revalidation.
 */

/**
 * Adds a new category to the database.
 *
 * @param formData - FormData containing `name`, `description`, and optional `sortOrder`
 * @throws Error if `name` is missing
 */
export async function addCategory(formData: FormData) {
  // Extract form data with proper typecasting
  const name = formData.get("name") as string;
  const description = (formData.get("description") as string) || "";
  const sortOrder = Number(formData.get("sortOrder")) || 0;

  // Validate required fields
  if (!name) throw new Error("Category name is required");

  // Generate slug from name (basic placeholder slug strategy)
  const slug = name.toLowerCase().replace(/\s+/g, "-");

  // Persist new category to the database
  await prisma.category.create({
    data: { name, description, slug, sortOrder },
  });

  // Revalidate the dashboard menu path to reflect the new category
  revalidatePath("/dashboard/menu");
}

/**
 * Updates an existing category in the database.
 *
 * @param formData - FormData containing `id`, `name`, `description`, and optional `sortOrder`
 * @returns The updated category object
 * @throws Error if `id` or `name` is missing
 */
export async function updateCategory(formData: FormData) {
  const id = Number(formData.get("id"));
  const name = formData.get("name") as string;
  const description = (formData.get("description") as string) || "";
  const sortOrder = Number(formData.get("sortOrder")) || 0;

  if (!id || !name) throw new Error("Invalid category data");

  const slug = name.toLowerCase().replace(/\s+/g, "-");

  // Update category in the database
  const updated = await prisma.category.update({
    where: { id },
    data: { name, description, slug, sortOrder },
  });

  // Revalidate dashboard path to reflect changes
  revalidatePath("/dashboard/menu");

  return updated;
}

/**
 * Deletes a category from the database.
 *
 * @param id - ID of the category to delete
 * @throws Error if deletion fails (e.g., invalid ID)
 */
export async function deleteCategory(id: number) {
  if (!id) throw new Error("Category ID is required for deletion");

  // Remove category from the database
  await prisma.category.delete({ where: { id } });

  // Revalidate dashboard menu path to reflect deletion
  revalidatePath("/dashboard/menu");
}
