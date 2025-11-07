import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { OrderType } from "@prisma/client";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// ------------------- Types -------------------
interface Address {
  line1: string;
  city: string;
  postal_code: string;
  country: string;
  lat?: number;
  lng?: number;
  fullAddress?: string;
}

interface CartAddonInput {
  id: number;
  name?: string;
  pricePence?: number;
}

interface CartItemInput {
  id: number;
  name?: string;
  pricePence?: number;
  quantity: number;
  addons?: CartAddonInput[];
  orderType: OrderType;
  deliveryDates: string[];
}

interface OrderItemPayload {
  productId: number;
  quantity: number;
  unitPricePence: number;
  totalPricePence: number;
  productSnapshot: {
    name: string;
    basePricePence: number;
    maxFreeAddons: number;
    maxPaidAddons: number;
  };
  addons: {
    addonId: number;
    addonSnapshot: {
      name: string;
      pricePence: number;
      type: "FREE" | "PAID";
    };
  }[];
  deliveryDates: string[];
  itemType: OrderType;
}

// ------------------- Helper Functions -------------------

// Validate all delivery dates
async function validateDeliveryDates(dates: string[]) {
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

// Validate addons against limits
function validateAddons(
  product: {
    name: string;
    maxFreeAddons: number;
    maxPaidAddons: number;
  },
  selectedAddons: Array<{ type: "FREE" | "PAID" }>
): { valid: boolean; error?: string } {
  const freeCount = selectedAddons.filter((a) => a.type === "FREE").length;
  const paidCount = selectedAddons.filter((a) => a.type === "PAID").length;

  if (freeCount > product.maxFreeAddons) {
    return {
      valid: false,
      error: `"${product.name}" allows max ${product.maxFreeAddons} free addon(s), but ${freeCount} selected`,
    };
  }

  if (paidCount > product.maxPaidAddons) {
    return {
      valid: false,
      error: `"${product.name}" allows max ${product.maxPaidAddons} paid addon(s), but ${paidCount} selected`,
    };
  }

  return { valid: true };
}

// ------------------- Main Handler -------------------
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { items, customerEmail, customerPhone, deliveryAddress } = body as {
      items: CartItemInput[];
      customerEmail: string;
      customerPhone?: string;
      deliveryAddress: Address;
    };

    if (
      !customerEmail ||
      !deliveryAddress?.line1 ||
      !deliveryAddress?.city ||
      !deliveryAddress?.postal_code
    ) {
      return NextResponse.json(
        { error: "Missing required fields (email or address)" },
        { status: 400 }
      );
    }

    if (!items?.length) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }

    // Validate dates
    const allDates = items.flatMap((i) => i.deliveryDates);
    try {
      await validateDeliveryDates(allDates);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Invalid delivery dates";
      return NextResponse.json({ error: message }, { status: 400 });
    }

    // Fetch products and addons
    const productIds = items.map((i) => i.id);
    const addonIds = items
      .flatMap((i) => i.addons?.map((a) => a.id) ?? [])
      .filter((id) => !isNaN(id));

    const [products, addons] = await Promise.all([
      prisma.product.findMany({
        where: { id: { in: productIds } },
        select: {
          id: true,
          name: true,
          basePricePence: true,
          maxFreeAddons: true,
          maxPaidAddons: true,
        },
      }),
      prisma.addon.findMany({
        where: { id: { in: addonIds } },
        select: { id: true, name: true, pricePence: true, type: true },
      }),
    ]);

    let totalPence = 0;
    const orderItemsPayload: OrderItemPayload[] = [];

    for (const cartItem of items) {
      const product = products.find((p) => p.id === cartItem.id);
      if (!product) {
        return NextResponse.json(
          { error: `Product not found: ${cartItem.id}` },
          { status: 400 }
        );
      }

      const selectedAddons =
        cartItem.addons?.map((a) => addons.find((x) => x.id === a.id)) ?? [];
      if (selectedAddons.some((a) => !a)) {
        return NextResponse.json(
          { error: `One or more addons not found for product ${product.name}` },
          { status: 400 }
        );
      }

      const addonValidation = validateAddons(
        product,
        selectedAddons as Array<{ type: "FREE" | "PAID" }>
      );
      if (!addonValidation.valid) {
        return NextResponse.json(
          { error: addonValidation.error },
          { status: 400 }
        );
      }

      const addonsTotal = selectedAddons.reduce(
        (sum, a) => sum + (a?.pricePence ?? 0),
        0
      );

      const unitPrice = product.basePricePence + addonsTotal;
      const qty = Math.max(1, cartItem.quantity);
      const deliveries = cartItem.deliveryDates.length;
      const subtotal = unitPrice * qty * deliveries;

      totalPence += subtotal;

      orderItemsPayload.push({
        productId: product.id,
        quantity: qty,
        unitPricePence: unitPrice,
        totalPricePence: subtotal,
        productSnapshot: {
          name: product.name,
          basePricePence: product.basePricePence,
          maxFreeAddons: product.maxFreeAddons,
          maxPaidAddons: product.maxPaidAddons,
        },
        addons:
          selectedAddons.length > 0
            ? selectedAddons.map((a) => ({
                addonId: a!.id,
                addonSnapshot: {
                  name: a!.name,
                  pricePence: a!.pricePence,
                  type: a!.type,
                },
              }))
            : [],
        deliveryDates: cartItem.deliveryDates,
        itemType: cartItem.orderType,
      });
    }

    if (totalPence <= 0) {
      return NextResponse.json({ error: "Invalid total" }, { status: 400 });
    }

    // Create order
    const orderNumber = `ORD-${Date.now().toString(36)}`;
    const order = await prisma.order.create({
      data: {
        orderNumber,
        customerEmail,
        customerPhone: customerPhone || null,
        deliveryAddress: JSON.parse(JSON.stringify(deliveryAddress)),
        subtotalPence: totalPence,
        totalAmountPence: totalPence,
        paymentStatus: "PENDING",
        orderStatus: "ACTIVE",
      },
    });

    const createdItems = await Promise.all(
      orderItemsPayload.map(async (p) => {
        const item = await prisma.orderItem.create({
          data: {
            orderId: order.id,
            productId: p.productId,
            quantity: p.quantity,
            unitPricePence: p.unitPricePence,
            totalPricePence: p.totalPricePence,
            productSnapshot: p.productSnapshot,
            itemType: p.itemType,
            addons:
              p.addons.length > 0
                ? { create: p.addons.map((a) => ({ ...a })) }
                : undefined,
          },
        });

        await Promise.all(
          p.deliveryDates.map((date: string) =>
            prisma.orderDelivery.create({
              data: {
                orderId: order.id,
                orderItemId: item.id,
                deliveryDate: new Date(date),
                status: "SCHEDULED",
              },
            })
          )
        );

        return item;
      })
    );

    // Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "gbp",
            product_data: {
              name: `Order #${order.orderNumber}`,
              description: `${createdItems.length} item${
                createdItems.length > 1 ? "s" : ""
              }`,
            },
            unit_amount: totalPence,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${process.env.NEXTAUTH_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}&order_id=${order.id}`,
      cancel_url: `${process.env.NEXTAUTH_URL}/checkout/cancel`,
      customer_email: customerEmail,
      metadata: {
        orderId: order.id.toString(),
        itemCount: createdItems.length.toString(),
      },
    });

    await prisma.order.update({
      where: { id: order.id },
      data: { stripePaymentIntentId: session.id },
    });

    return NextResponse.json({
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        totalAmountPence: order.totalAmountPence,
      },
      stripeSession: session,
    });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
