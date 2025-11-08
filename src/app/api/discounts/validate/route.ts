import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type IncomingAddon = { id: number; pricePence: number };
type IncomingItem = {
  id: number;
  name: string;
  pricePence: number;
  quantity: number;
  addons?: IncomingAddon[];
  deliveryDates: string[];
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { code, items } = body as {
      code?: string;
      items?: IncomingItem[];
    };

    if (!code || !items?.length) {
      return NextResponse.json(
        { valid: false, message: "Missing discount code or cart items" },
        { status: 400 }
      );
    }

    const [discount, allCategories] = await Promise.all([
      prisma.discount.findUnique({ where: { code } }),
      prisma.category.findMany({ select: { id: true } }),
    ]);

    if (!discount || !discount.isActive) {
      return NextResponse.json(
        { valid: false, message: "Discount not found or inactive" },
        { status: 404 }
      );
    }

    const allCategoryIds = allCategories.map((c) => c.id);
    const discountCategoryIds = discount.categoryIds ?? [];

    // Applies to all ONLY if the discount covers ALL category IDs (every one)
    const appliesToAll =
      discountCategoryIds.length > 0 &&
      allCategoryIds.length > 0 &&
      allCategoryIds.every((id) => discountCategoryIds.includes(id));

    const productIds = items.map((i) => i.id);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, categoryId: true },
    });

    const productCategoryMap = new Map<number, number>();
    for (const p of products) productCategoryMap.set(p.id, p.categoryId);

    let subtotalPence = 0;
    let eligibleSubtotalPence = 0;

    for (const item of items) {
      const addonsPrice =
        (item.addons ?? []).reduce((a, b) => a + (b.pricePence ?? 0), 0) ?? 0;

      const pricePerDelivery = item.pricePence + addonsPrice;
      const deliveries = item.deliveryDates?.length ?? 0;
      const totalForItem = pricePerDelivery * item.quantity * deliveries;
      subtotalPence += totalForItem;

      const categoryId = productCategoryMap.get(item.id);

      // Now only eligible if either appliesToAll = true OR the product’s category is one of the selected ones
      const eligible =
        appliesToAll ||
        (categoryId !== undefined && discountCategoryIds.includes(categoryId));

      if (eligible) eligibleSubtotalPence += totalForItem;
    }

    // If no eligible items, reject discount
    if (eligibleSubtotalPence === 0) {
      return NextResponse.json(
        {
          valid: false,
          message: "This discount does not apply to selected products.",
        },
        { status: 400 }
      );
    }

    if (subtotalPence < (discount.minOrderAmountPence ?? 0)) {
      return NextResponse.json(
        {
          valid: false,
          message: `Minimum order value not met (£${(
            (discount.minOrderAmountPence ?? 0) / 100
          ).toFixed(2)} required)`,
        },
        { status: 400 }
      );
    }

    let discountAmountPence = 0;

    if (discount.type === "FIXED") {
      discountAmountPence = discount.valuePence;
    } else if (discount.type === "PERCENTAGE") {
      const percent = discount.valuePence / 100;
      discountAmountPence = Math.floor(eligibleSubtotalPence * percent);

      if (
        discount.maxDiscountCapPence &&
        discountAmountPence > discount.maxDiscountCapPence
      ) {
        discountAmountPence = discount.maxDiscountCapPence;
      }
    }

    if (discountAmountPence > subtotalPence)
      discountAmountPence = subtotalPence;

    const totalAmountPence = subtotalPence - discountAmountPence;

    return NextResponse.json({
      valid: true,
      message: "Discount applied successfully",
      subtotalPence,
      discountAmountPence,
      totalAmountPence,
      discount: {
        id: discount.id,
        code: discount.code,
        description: discount.description,
        type: discount.type,
        valuePence: discount.valuePence,
        categoryIds: discount.categoryIds,
      },
    });
  } catch (error) {
    console.error("Error validating discount:", error);
    return NextResponse.json(
      { valid: false, message: "Server error" },
      { status: 500 }
    );
  }
}
