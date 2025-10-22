import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Type for Addon coming from frontend
type AddonInput = {
  id: string | number;
  name: string;
  pricePence: number;
};

// Type for a cart item coming from frontend
type OrderItemInput = {
  id: string | number;
  name: string;
  slug?: string;
  pricePence: number;
  quantity: number;
  addons?: AddonInput[];
};

// Type for the request body
type OrderRequestBody = {
  customerEmail: string;
  customerPhone?: string;
  deliveryAddress: string; // can refine later if structured
  orderType?: "ONE_TIME" | "WEEKLY_PLAN";
  items: OrderItemInput[];
};

export async function POST(req: Request) {
  try {
    const body: OrderRequestBody = await req.json();

    const {
      customerEmail,
      customerPhone,
      deliveryAddress,
      orderType = "ONE_TIME",
      items,
    } = body;

    if (!items || items.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }

    // Calculate subtotal
    let subtotal = 0;
    for (const item of items) {
      const base = item.pricePence * item.quantity;
      const addonsTotal =
        (item.addons?.reduce((sum, a) => sum + a.pricePence, 0) || 0) *
        item.quantity;
      subtotal += base + addonsTotal;
    }

    const total = subtotal;

    // Generate order number
    const count = await prisma.order.count();
    const orderNumber = `ORD-${new Date().getFullYear()}-${String(
      count + 1
    ).padStart(5, "0")}`;

    const paymentStatus: "PAID" | "PENDING" = "PAID";

    // Create order with typed items
    const order = await prisma.order.create({
      data: {
        orderNumber,
        customerEmail,
        customerPhone,
        deliveryAddress,
        orderType,
        subtotalPence: subtotal,
        totalAmountPence: total,
        paymentStatus,
        orderStatus: "ACTIVE",
        items: {
          create: items.map((item) => ({
            quantity: item.quantity,
            unitPricePence: item.pricePence,
            totalPricePence:
              (item.pricePence +
                (item.addons?.reduce((sum, a) => sum + a.pricePence, 0) || 0)) *
              item.quantity,
            productId: Number(item.id),
            productSnapshot: {
              name: item.name,
              slug: item.slug ?? "",
              basePricePence: item.pricePence,
            },
            addons: item.addons?.length
              ? {
                  create: item.addons.map((addon) => ({
                    addonId: Number(addon.id),
                    addonSnapshot: {
                      id: String(addon.id),
                      name: addon.name,
                      pricePence: addon.pricePence,
                    },
                  })),
                }
              : undefined,
          })),
        },
      },
      include: {
        items: {
          include: { addons: true },
        },
      },
    });

    return NextResponse.json({ success: true, order });
  } catch (err) {
    console.error("Order error:", err);
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
  }
}
