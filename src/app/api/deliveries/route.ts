import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { OrderType, Prisma } from "@prisma/client";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const qs = url.searchParams;

    const page = Math.max(1, parseInt(qs.get("page") || "1"));
    const limit = Math.min(200, Math.max(1, parseInt(qs.get("limit") || "50")));
    const skip = (page - 1) * limit;

    const date = qs.get("date");
    const from = qs.get("from");
    const to = qs.get("to");
    const itemType = qs.get("itemType");
    const q = qs.get("q");

    const where: Prisma.OrderDeliveryWhereInput = {};

    if (date) {
      const d = new Date(date);
      const next = new Date(d);
      next.setDate(next.getDate() + 1);
      where.deliveryDate = { gte: d, lt: next };
    } else if (from || to) {
      where.deliveryDate = {};
      if (from) where.deliveryDate.gte = new Date(from);
      if (to) {
        const t = new Date(to);
        t.setDate(t.getDate() + 1);
        where.deliveryDate.lte = t;
      }
    }

    if (q) {
      where.OR = [
        { order: { orderNumber: { contains: q, mode: "insensitive" } } },
        { order: { customerEmail: { contains: q, mode: "insensitive" } } },
      ];
    }

    if (itemType) {
      // uses order.items.some(...) relation via nested where
      where.order = {
        items: {
          some: {
            itemType: itemType as OrderType | string,
          },
        },
      } as Prisma.OrderWhereInput;
    }

    const [deliveries, total] = await Promise.all([
      prisma.orderDelivery.findMany({
        where,
        include: {
          order: {
            include: {
              items: {
                include: {
                  product: true,
                  addons: { include: { addon: true } },
                },
              },
            },
          },
        },
        orderBy: { deliveryDate: "asc" },
        skip,
        take: limit,
      }),
      prisma.orderDelivery.count({ where }),
    ]);

    return NextResponse.json({
      deliveries,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("GET /api/deliveries error", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
