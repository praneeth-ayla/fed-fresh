import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const parsedId = Number(id);
    if (isNaN(parsedId))
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });

    const body = await req.json();
    const { status } = body;

    if (!status)
      return NextResponse.json({ error: "status required" }, { status: 400 });

    const updated = await prisma.orderDelivery.update({
      where: { id: parsedId },
      data: {
        status,
        deliveredAt: status === "DELIVERED" ? new Date() : null,
      },
    });

    return NextResponse.json({ updated });
  } catch (error) {
    console.error("PATCH /api/deliveries/[id] error", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
