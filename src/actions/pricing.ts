"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

function toNumber(input: FormDataEntryValue | null): number {
  if (!input) return 0;
  const n = Number(input);
  return Number.isFinite(n) ? Math.round(n) : 0;
}

function parseCategoryIds(all: FormDataEntryValue[]): number[] {
  return (all as string[])
    .map((v) => Number(v))
    .filter((v) => Number.isInteger(v));
}

export async function addDiscount(formData: FormData) {
  const code = (formData.get("code") as string)?.trim();
  const type = formData.get("type") as "FIXED" | "PERCENTAGE";

  if (!code || (type !== "FIXED" && type !== "PERCENTAGE")) {
    throw new Error("Invalid discount payload");
  }

  const description = (formData.get("description") as string) || "";
  const categoryIds = parseCategoryIds(formData.getAll("categories"));

  const minOrderAmountPence = toNumber(formData.get("minOrder"));
  const valuePence =
    type === "FIXED"
      ? toNumber(formData.get("value")) // value in pence
      : toNumber(formData.get("value")); // integer percent

  const maxDiscountCapPence =
    type === "PERCENTAGE" ? toNumber(formData.get("maxCap")) || null : null;

  await prisma.discount.create({
    data: {
      code,
      description,
      type,
      valuePence,
      minOrderAmountPence,
      maxDiscountCapPence,
      categoryIds,
      isActive: true,
    },
  });

  revalidatePath("/pricing");
}

export async function updateDiscount(formData: FormData) {
  const id = Number(formData.get("id"));
  if (!id) throw new Error("Invalid ID");

  const code = (formData.get("code") as string)?.trim();
  const type = formData.get("type") as "FIXED" | "PERCENTAGE";
  if (!code || (type !== "FIXED" && type !== "PERCENTAGE")) {
    throw new Error("Invalid discount payload");
  }

  const description = (formData.get("description") as string) || "";
  const categoryIds = parseCategoryIds(formData.getAll("categories"));

  const minOrderAmountPence = toNumber(formData.get("minOrder"));
  const valuePence =
    type === "FIXED"
      ? toNumber(formData.get("value"))
      : toNumber(formData.get("value"));

  const maxDiscountCapPence =
    type === "PERCENTAGE" ? toNumber(formData.get("maxCap")) || null : null;

  await prisma.discount.update({
    where: { id },
    data: {
      code,
      description,
      type,
      valuePence,
      minOrderAmountPence,
      maxDiscountCapPence,
      categoryIds,
    },
  });

  revalidatePath("/pricing");
}

export async function deleteDiscount(id: number) {
  if (!id) throw new Error("Discount ID is required");
  await prisma.discount.delete({ where: { id } });
  revalidatePath("/pricing");
}

export async function disableDiscount(id: number) {
  try {
    const discount = await prisma.discount.findUnique({ where: { id } });
    if (!discount) return;

    await prisma.discount.update({
      where: { id },
      data: { isActive: !discount.isActive },
    });

    revalidatePath("/pricing");
  } catch (err) {
    console.error("Toggle failed:", err);
  }
}
