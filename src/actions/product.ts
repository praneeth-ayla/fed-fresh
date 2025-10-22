"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

/**
 * @file actions/product.ts
 * @description Server-side actions for managing products in the admin dashboard.
 * Includes functions to create, update, delete, duplicate, and toggle product activity.
 * Uses Prisma ORM and Next.js cache revalidation.
 */

/**
 * Type representing a product addon coming from the frontend.
 */
type AddonInput = {
  name: string;
  description?: string | null;
  pricePence?: number | null;
  type?: "PAID" | "FREE" | null;
};

/**
 * 🔹 HELPER: Parse Addons JSON from FormData
 * Safely parses JSON string of addons and returns array of AddonInput
 * Placeholder: default type determination is basic and may need refinement
 */
function parseAddons(formData: FormData): AddonInput[] {
  const raw = formData.get("addons") as string | null;
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed.map((a) => ({
      name: String(a.name || "").trim(),
      description: a.description ? String(a.description) : null,
      pricePence: typeof a.pricePence === "number" ? a.pricePence : 0,
      type: a.pricePence && a.pricePence > 0 ? "PAID" : "FREE", // Placeholder logic
    }));
  } catch {
    return [];
  }
}

/**
 * 🔹 HELPER: Parse Images JSON from FormData
 * Safely parses JSON string of image URLs and returns array of objects for DB insertion
 */
function parseImages(formData: FormData): { url: string }[] {
  const raw = formData.get("images") as string | null;
  if (!raw) return [];

  try {
    const urls = JSON.parse(raw);
    if (!Array.isArray(urls)) return [];

    return urls.map((url: string) => ({
      url,
      // metadata placeholder for future extension
    }));
  } catch {
    return [];
  }
}

/**
 * 🔹 CREATE PRODUCT
 * Inserts a new product along with optional addons and images
 */
export async function addProduct(formData: FormData) {
  const name = (formData.get("name") as string | null)?.trim();
  const description = (formData.get("description") as string) || null;
  const categoryId = Number(formData.get("categoryId"));
  const basePricePence = Number(formData.get("basePricePence")) || 0;
  const allergenNotes = (formData.get("allergenNotes") as string) || null;
  const tags = (formData.get("tags") as string) || null;
  const maxFreeAddons = Number(formData.get("maxFreeAddons")) || 0;
  const maxPaidAddons = Number(formData.get("maxPaidAddons")) || 0;
  const availabilityOneTime = formData.get("availabilityOneTime") === "true";
  const availabilityWeekly = formData.get("availabilityWeekly") === "true";

  if (!name || !categoryId) throw new Error("Missing required fields");

  const slug = name.toLowerCase().replace(/\s+/g, "-");

  const addons = parseAddons(formData);
  const images = parseImages(formData);

  await prisma.$transaction(async (tx) => {
    const created = await tx.product.create({
      data: {
        name,
        description,
        categoryId,
        basePricePence,
        allergenNotes,
        tags,
        maxFreeAddons,
        maxPaidAddons,
        availabilityOneTime,
        availabilityWeekly,
        isActive: true,
        slug,
      },
    });

    if (addons.length > 0) {
      await tx.addon.createMany({
        data: addons.map((a) => ({
          name: a.name,
          description: a.description ?? null,
          pricePence: a.pricePence ?? 0,
          type: a.type ?? "FREE",
          productId: created.id,
        })),
      });
    }

    if (images.length > 0) {
      await tx.image.createMany({
        data: images.map((img) => ({
          url: img.url,
          productId: created.id,
        })),
      });
    }
  });

  revalidatePath("/dashboard/menu");
}

/**
 * 🔹 UPDATE PRODUCT
 * Updates an existing product and replaces its addons and images
 */
export async function updateProduct(formData: FormData) {
  const id = Number(formData.get("id"));
  const name = (formData.get("name") as string | null)?.trim();
  const description = (formData.get("description") as string) || null;
  const categoryId = Number(formData.get("categoryId"));
  const basePricePence = Number(formData.get("basePricePence")) || 0;
  const allergenNotes = (formData.get("allergenNotes") as string) || null;
  const tags = (formData.get("tags") as string) || null;
  const maxFreeAddons = Number(formData.get("maxFreeAddons")) || 0;
  const maxPaidAddons = Number(formData.get("maxPaidAddons")) || 0;
  const availabilityOneTime = formData.get("availabilityOneTime") === "true";
  const availabilityWeekly = formData.get("availabilityWeekly") === "true";

  if (!id || !name) throw new Error("Invalid product data");

  const slug = name.toLowerCase().replace(/\s+/g, "-");

  const addons = parseAddons(formData);
  const images = parseImages(formData);

  const updated = await prisma.$transaction(async (tx) => {
    const prod = await tx.product.update({
      where: { id },
      data: {
        name,
        description,
        categoryId,
        basePricePence,
        allergenNotes,
        tags,
        maxFreeAddons,
        maxPaidAddons,
        availabilityOneTime,
        availabilityWeekly,
        slug,
      },
    });

    // Replace existing addons
    await tx.addon.deleteMany({ where: { productId: id } });
    if (addons.length > 0) {
      await tx.addon.createMany({
        data: addons.map((a) => ({
          name: a.name,
          description: a.description ?? null,
          pricePence: a.pricePence ?? 0,
          type: a.type ?? "FREE",
          productId: id,
        })),
      });
    }

    // Replace existing images
    await tx.image.deleteMany({ where: { productId: id } });
    if (images.length > 0) {
      await tx.image.createMany({
        data: images.map((img) => ({
          url: img.url,
          productId: id,
        })),
      });
    }

    return prod;
  });

  revalidatePath("/dashboard/menu");
  return updated;
}

/**
 * 🔹 DELETE PRODUCT
 * Deletes a product and its associated addons and images
 */
export async function deleteProduct(id: number) {
  if (!id) throw new Error("Invalid product ID");

  await prisma.$transaction([
    prisma.addon.deleteMany({ where: { productId: id } }),
    prisma.image.deleteMany({ where: { productId: id } }),
    prisma.product.delete({ where: { id } }),
  ]);

  revalidatePath("/dashboard/menu");
}

/**
 * 🔹 TOGGLE PRODUCT ACTIVE STATUS
 */
export async function toggleProductActive(id: number, active: boolean) {
  if (!id) throw new Error("Invalid product ID");

  const updated = await prisma.product.update({
    where: { id },
    data: { isActive: active },
  });

  revalidatePath("/dashboard/menu");
  return updated;
}

/**
 * 🔹 DUPLICATE PRODUCT
 * Creates a copy of an existing product including its images and addons
 * Copied product is set inactive by default
 */
export async function duplicateProduct(id: number) {
  const product = await prisma.product.findUnique({
    where: { id },
    include: { images: true, addons: true },
  });

  if (!product) throw new Error("Product not found");

  const newProduct = await prisma.$transaction(async (tx) => {
    const created = await tx.product.create({
      data: {
        name: `${product.name} (Copy)`,
        description: product.description,
        categoryId: product.categoryId,
        basePricePence: product.basePricePence,
        allergenNotes: product.allergenNotes,
        tags: product.tags,
        maxFreeAddons: product.maxFreeAddons,
        maxPaidAddons: product.maxPaidAddons,
        isActive: false,
        slug: product.slug,
      },
    });

    if (product.images.length > 0) {
      await tx.image.createMany({
        data: product.images.map((img) => ({
          url: img.url,
          productId: created.id,
        })),
      });
    }

    if (product.addons.length > 0) {
      await tx.addon.createMany({
        data: product.addons.map((a) => ({
          name: a.name,
          description: a.description,
          pricePence: a.pricePence,
          type: a.type ?? "FREE",
          productId: created.id,
        })),
      });
    }

    return created;
  });

  revalidatePath("/dashboard/menu");
  return newProduct;
}
