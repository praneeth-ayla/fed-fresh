"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

type AddonInput = {
  name: string;
  description?: string | null;
  pricePence?: number | null;
  type?: string | null;
};

// 🔹 HELPER: Parse Addons JSON from FormData
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
      type: a.pricePence && a.pricePence > 0 ? "PAID" : "FREE",
    }));
  } catch {
    return [];
  }
}

// 🔹 HELPER: Parse Images JSON from FormData
function parseImages(formData: FormData): { url: string }[] {
  const raw = formData.get("images") as string | null;
  if (!raw) return [];

  try {
    const urls = JSON.parse(raw);
    if (!Array.isArray(urls)) return [];

    return urls.map((url: string) => ({
      url,
    }));
  } catch {
    return [];
  }
}

// 🔹 CREATE PRODUCT
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
      },
    });

    if (addons.length > 0) {
      await tx.addon.createMany({
        data: addons.map((a) => ({
          name: a.name,
          description: a.description ?? null,
          pricePence: a.pricePence ?? 0,
          type: a.pricePence && a.pricePence > 0 ? "PAID" : "FREE",
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

  revalidatePath("/admin/menu");
}

// 🔹 UPDATE PRODUCT
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
      },
    });

    await tx.addon.deleteMany({ where: { productId: id } });

    if (addons.length > 0) {
      await tx.addon.createMany({
        data: addons.map((a) => ({
          name: a.name,
          description: a.description ?? null,
          pricePence: a.pricePence ?? 0,
          type: a.pricePence && a.pricePence > 0 ? "PAID" : "FREE",
          productId: id,
        })),
      });
    }

    // Replace all existing images
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

  revalidatePath("/admin/menu");
  return updated;
}

// 🔹 DELETE PRODUCT
export async function deleteProduct(id: number) {
  if (!id) throw new Error("Invalid product ID");

  await prisma.$transaction([
    prisma.addon.deleteMany({ where: { productId: id } }),
    prisma.image.deleteMany({ where: { productId: id } }),
    prisma.product.delete({ where: { id } }),
  ]);

  revalidatePath("/admin/menu");
}

// 🔹 TOGGLE ACTIVE
export async function toggleProductActive(id: number, active: boolean) {
  if (!id) throw new Error("Invalid product ID");

  const updated = await prisma.product.update({
    where: { id },
    data: { isActive: active },
  });

  revalidatePath("/admin/menu");
  return updated;
}

// 🔹 DUPLICATE PRODUCT
export async function duplicateProduct(id: number) {
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      images: true,
      addons: true,
    },
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
      },
    });

    if (product.images.length > 0) {
      await tx.image.createMany({
        data: product.images.map((img) => ({
          url: img.url,
          metadata: img.metadata,
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
          type: a.type as any,
          productId: created.id,
        })),
      });
    }

    return created;
  });

  revalidatePath("/admin/menu");
  return newProduct;
}
