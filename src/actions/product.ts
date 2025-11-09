"use server";

import { prisma } from "@/lib/prisma";
import { Addon } from "@prisma/client";
import { revalidateTag } from "next/cache";
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
 * HELPER: Parse Addons JSON from FormData
 * Safely parses JSON string of addons and returns array of AddonInput
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
 * HELPER: Parse Images JSON from FormData
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
 * CREATE PRODUCT
 * Inserts a new product along with optional addons and images
 */
export async function addProduct(formData: FormData) {
  const name = (formData.get("name") as string | null)?.trim();
  const description = (formData.get("description") as string) || null;
  const categoryId = Number(formData.get("categoryId"));
  const basePricePence = Number(formData.get("basePricePence")) || 0;
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
        data: images.map((img, i) => ({
          url: img.url,
          productId: created.id,
          metadata: `Fed fresh ${name} ${i}`,
        })),
      });
    }
  });

  const category = await prisma.category.findUnique({
    where: { id: categoryId },
    select: { slug: true },
  });

  // Revalidate admin and public pages
  revalidatePath("/dashboard/menu");
  if (category?.slug) revalidatePath(`/menu/${category.slug}`);
}

/**
 * UPDATE PRODUCT
 * Updates an existing product and replaces its addons and images
 */
export async function updateProduct(formData: FormData) {
  const id = Number(formData.get("id"));
  const name = (formData.get("name") as string | null)?.trim();
  const description = (formData.get("description") as string) || null;
  const categoryId = Number(formData.get("categoryId"));
  const basePricePence = Number(formData.get("basePricePence")) || 0;
  const tags = (formData.get("tags") as string) || null;
  const maxFreeAddons = Number(formData.get("maxFreeAddons")) || 0;
  const maxPaidAddons = Number(formData.get("maxPaidAddons")) || 0;
  const availabilityOneTime = formData.get("availabilityOneTime") === "true";
  const availabilityWeekly = formData.get("availabilityWeekly") === "true";

  if (!id || !name) throw new Error("Invalid product data");

  const slug = name.toLowerCase().replace(/\s+/g, "-");

  const newAddons = parseAddons(formData);
  const newImages = parseImages(formData);

  const updated = await prisma.$transaction(async (tx) => {
    // Get current data for comparison
    const existingProduct = await tx.product.findUnique({
      where: { id },
      include: { addons: true, images: true },
    });
    if (!existingProduct) throw new Error("Product not found");

    // Update only changed product fields
    await tx.product.update({
      where: { id },
      data: {
        name: existingProduct.name !== name ? name : undefined,
        description:
          existingProduct.description !== description ? description : undefined,
        categoryId:
          existingProduct.categoryId !== categoryId ? categoryId : undefined,
        basePricePence:
          existingProduct.basePricePence !== basePricePence
            ? basePricePence
            : undefined,
        tags: existingProduct.tags !== tags ? tags : undefined,
        maxFreeAddons:
          existingProduct.maxFreeAddons !== maxFreeAddons
            ? maxFreeAddons
            : undefined,
        maxPaidAddons:
          existingProduct.maxPaidAddons !== maxPaidAddons
            ? maxPaidAddons
            : undefined,
        availabilityOneTime:
          existingProduct.availabilityOneTime !== availabilityOneTime
            ? availabilityOneTime
            : undefined,
        availabilityWeekly:
          existingProduct.availabilityWeekly !== availabilityWeekly
            ? availabilityWeekly
            : undefined,
        slug: existingProduct.slug !== slug ? slug : undefined,
      },
    });

    const existingAddons = existingProduct.addons;

    // Find addons to delete (no longer in new list)
    const toDelete = existingAddons.filter(
      (old) =>
        !newAddons.some(
          (na) => na.name.toLowerCase() === old.name.toLowerCase()
        )
    );

    for (const addon of toDelete) {
      const used = await tx.orderItemAddon.findFirst({
        where: { addonId: addon.id },
        select: { id: true },
      });

      if (used) {
        // Mark inactive if it's used
        await tx.addon.update({
          where: { id: addon.id },
          data: { isActive: false },
        });
      } else {
        // Safe to delete
        await tx.addon.delete({ where: { id: addon.id } });
      }
    }

    // Add or update addons that remain or are new
    for (const newAddon of newAddons) {
      const existing = existingAddons.find(
        (a) => a.name.toLowerCase() === newAddon.name.toLowerCase()
      );

      if (existing) {
        // Use Partial to avoid having to define all fields
        const updateData: Partial<Addon> = {};

        if (existing.description !== newAddon.description)
          updateData.description = newAddon.description ?? null; // never undefined

        if (existing.pricePence !== newAddon.pricePence)
          updateData.pricePence = newAddon.pricePence ?? 0; // always number

        if (existing.type !== newAddon.type)
          updateData.type = newAddon.type ?? "FREE"; // always valid enum

        if (existing.isActive === false) updateData.isActive = true;

        if (Object.keys(updateData).length > 0) {
          await tx.addon.update({
            where: { id: existing.id },
            data: updateData as Addon,
          });
        }
      } else {
        await tx.addon.create({
          data: {
            name: newAddon.name,
            description: newAddon.description ?? null,
            pricePence: newAddon.pricePence ?? 0,
            type: newAddon.type ?? "FREE",
            isActive: true,
            productId: id,
          },
        });
      }
    }

    // Handle images (replace all for simplicity)
    await tx.image.deleteMany({ where: { productId: id } });
    if (newImages.length > 0) {
      await tx.image.createMany({
        data: newImages.map((img, i) => ({
          url: img.url,
          productId: id,
          metadata: `Fed fresh ${name} ${i}`,
        })),
      });
    }

    return existingProduct;
  });

  const category = await prisma.category.findUnique({
    where: { id: categoryId },
    select: { slug: true },
  });

  revalidatePath("/dashboard/menu");
  if (category?.slug) revalidatePath(`/menu/${category.slug}`);
  return updated;
}

/**
 * DELETE PRODUCT
 * Deletes a product and its associated addons and images
 */

export async function deleteProduct(id: number) {
  if (!id) throw new Error("Invalid product ID");

  const product = await prisma.product.findUnique({
    where: { id },
    select: { categoryId: true },
  });

  const category = product
    ? await prisma.category.findUnique({
        where: { id: product.categoryId },
        select: { slug: true },
      })
    : null;

  await prisma.$transaction([
    prisma.addon.deleteMany({ where: { productId: id } }),
    prisma.image.deleteMany({ where: { productId: id } }),
    prisma.product.delete({ where: { id } }),
  ]);

  revalidatePath("/dashboard/menu");
  if (category?.slug) revalidatePath(`/menu/${category.slug}`);
}

/**
 * TOGGLE PRODUCT ACTIVE STATUS
 */
export async function toggleProductActive(id: number, active: boolean) {
  if (!id) throw new Error("Invalid product ID");

  const updated = await prisma.product.update({
    where: { id },
    data: { isActive: active },
  });

  revalidateTag("categories");
  revalidatePath("/dashboard/menu");
  if (updated?.slug) revalidatePath(`/menu/${updated.slug}`);
  return updated;
}

/**
 * DUPLICATE PRODUCT
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

  const category = product
    ? await prisma.category.findUnique({
        where: { id: product.categoryId },
        select: { slug: true },
      })
    : null;

  revalidatePath("/dashboard/menu");
  if (category?.slug) revalidatePath(`/menu/${category.slug}`);
  return newProduct;
}
