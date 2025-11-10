import DeliveriesClient, {
  DeliveryClientShape,
  OrderItemShape,
  OrderShape,
} from "./DeliveriesClient";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export const revalidate = 60;

type ServerDelivery = Prisma.OrderDeliveryGetPayload<{
  include: {
    order: {
      include: {
        items: {
          include: {
            product: true;
            addons: { include: { addon: true } };
          };
        };
      };
    };
  };
}>;

function safeAddress(raw: unknown): Record<string, unknown> {
  if (!raw) return {};
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw);
    } catch {
      return { raw };
    }
  }
  if (typeof raw === "object") return (raw as Record<string, unknown>) ?? {};
  return {};
}

export default async function DeliveriesPage() {
  const deliveries = (await prisma.orderDelivery.findMany({
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
  })) as ServerDelivery[];

  const mapped: DeliveryClientShape[] = deliveries.map((d) => {
    const address = safeAddress(d.order.deliveryAddress);

    const items: OrderItemShape[] = d.order.items.map((it) => ({
      id: it.id,
      quantity: it.quantity,
      unitPricePence: it.unitPricePence ?? 0,
      itemType: it.itemType,
      product: it.product
        ? { id: it.product.id, name: it.product.name ?? "Unknown" }
        : {
            id: 0,
            name:
              (typeof (it as { productSnapshot?: { name?: string } })
                .productSnapshot?.name === "string"
                ? (it as { productSnapshot?: { name?: string } })
                    .productSnapshot?.name
                : "Unknown") ?? "Unknown",
          },
      addons: (it.addons ?? []).map((a) => ({
        id: a.id,
        name: a.addon?.name ?? "",
      })),
    }));

    const order: OrderShape = {
      id: d.order.id,
      orderNumber: d.order.orderNumber,
      customerEmail: d.order.customerEmail,
      deliveryAddress: address,
      items,
    };

    return {
      id: d.id,
      deliveryDate: d.deliveryDate.toISOString(),
      status: d.status,
      deliveredAt: d.deliveredAt ? d.deliveredAt.toISOString() : null,
      orderItemId: d.orderItemId ?? null,
      order,
    };
  });

  return (
    <DeliveriesClient
      initialDeliveries={mapped}
      initialTotal={mapped.length}
      initialPage={1}
      limit={mapped.length || 1}
    />
  );
}
