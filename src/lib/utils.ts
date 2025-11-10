import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { prisma } from "./prisma";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const validatePostcode = (postcode: string): boolean => {
  const validPrefixes = ["LE1", "LE2", "LE3", "LE4", "LE5"];
  const cleaned = postcode.toUpperCase().replace(/\s/g, "");
  return validPrefixes.some((p) => cleaned.startsWith(p));
};

export async function validateDeliveryDates(dates: string[]) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const errors: string[] = [];

  for (const dateStr of dates) {
    const date = new Date(dateStr);
    date.setHours(0, 0, 0, 0);

    if (isNaN(date.getTime())) {
      errors.push(`${dateStr} is not a valid date`);
      continue;
    }

    if (date < today) {
      errors.push(`${dateStr} is in the past`);
      continue;
    }

    const isHoliday = await prisma.holiday.findUnique({
      where: { holidayDate: date },
    });
    if (isHoliday) {
      errors.push(`${dateStr} is a holiday: ${isHoliday.description}`);
      continue;
    }

    const availability = await prisma.availableDeliveryDate.findUnique({
      where: { deliveryDate: date },
    });
    if (availability) {
      if (!availability.available) {
        errors.push(`${dateStr} is not available for delivery`);
      } else if (
        availability.capacity &&
        availability.ordersBooked >= availability.capacity
      ) {
        errors.push(`${dateStr} is fully booked`);
      }
    }
  }

  if (errors.length) {
    throw new Error(`Delivery date validation failed: ${errors.join("; ")}`);
  }
}

export function validateAddons(
  product: {
    name: string;
    maxFreeAddons: number;
    maxPaidAddons: number;
  },
  selectedAddons: Array<{ type: "FREE" | "PAID" }>
): { valid: boolean; error?: string } {
  const freeCount = selectedAddons.filter((a) => a.type === "FREE").length;
  const paidCount = selectedAddons.filter((a) => a.type === "PAID").length;

  if (product.maxFreeAddons != 0 && freeCount > product.maxFreeAddons) {
    return {
      valid: false,
      error: `"${product.name}" allows max ${product.maxFreeAddons} free addon(s), but ${freeCount} selected`,
    };
  }

  if (product.maxPaidAddons != 0 && paidCount > product.maxPaidAddons) {
    return {
      valid: false,
      error: `"${product.name}" allows max ${product.maxPaidAddons} paid addon(s), but ${paidCount} selected`,
    };
  }

  return { valid: true };
}
