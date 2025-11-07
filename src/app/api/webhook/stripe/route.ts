import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature")!;

  try {
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;

      // Update order status to PAID
      await prisma.order.update({
        where: { id: parseInt(session.metadata!.orderId) },
        data: {
          paymentStatus: "PAID",
          orderStatus: "ACTIVE",
        },
      });

      // Here you can also trigger order fulfillment processes
      console.log(`Order ${session.metadata!.orderId} paid successfully`);
    }

    if (event.type === "checkout.session.expired") {
      const session = event.data.object as Stripe.Checkout.Session;

      // Update order status to FAILED if payment wasn't completed
      await prisma.order.update({
        where: { id: parseInt(session.metadata!.orderId) },
        data: {
          paymentStatus: "FAILED",
        },
      });
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 400 }
    );
  }
}
