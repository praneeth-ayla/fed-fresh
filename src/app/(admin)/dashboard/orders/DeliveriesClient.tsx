"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

/** -----------------------
 *  Types
 *  ---------------------- */
export type OrderItemShape = {
  id: number;
  quantity: number;
  unitPricePence: number;
  itemType?: string | null;
  product: { id: number; name: string };
  addons: { id: number; name: string }[];
};

export type OrderShape = {
  id: number;
  orderNumber: string;
  customerEmail?: string | null;
  deliveryAddress: Record<string, unknown>;
  items: OrderItemShape[];
};

export type DeliveryClientShape = {
  id: number;
  deliveryDate: string; // ISO
  status: string;
  deliveredAt: string | null;
  orderItemId: number | null;
  order: OrderShape;
};

/** -----------------------
 *  Helpers
 *  ---------------------- */
function formatCurrency(pence: number) {
  return `£${(pence / 100).toFixed(2)}`;
}

function addressLabel(addr: Record<string, unknown>) {
  // some possible keys used in different payloads
  const line =
    (addr["line1"] as string) || (addr["address_line_1"] as string) || "";
  const city = (addr["city"] as string) || (addr["town"] as string) || "";
  const post =
    (addr["postal_code"] as string) ||
    (addr["postcode"] as string) ||
    (addr["zip"] as string) ||
    "";
  return {
    title: line || post || "Unknown address",
    subtitle: [city, post].filter(Boolean).join(" "),
  };
}

function addressKeyFrom(order: OrderShape) {
  const a = order.deliveryAddress || {};
  return [
    a["line1"] as string | undefined,
    a["line2"] as string | undefined,
    a["city"] as string | undefined,
    (a["postal_code"] as string | undefined) ||
      (a["postcode"] as string | undefined),
    order.customerEmail,
  ]
    .filter(Boolean)
    .join(" | ");
}

function itemsForDelivery(d: DeliveryClientShape): OrderItemShape[] {
  if (d.orderItemId != null) {
    return d.order.items.filter((it) => it.id === d.orderItemId);
  }
  return d.order.items;
}

/** -----------------------
 *  Small UI bits
 *  ---------------------- */
function PillTab({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1 rounded-full text-sm ${
        active ? "bg-gray-900 text-white" : "bg-gray-200 hover:bg-gray-300"
      }`}
    >
      {children}
    </button>
  );
}

function Section({
  title,
  children,
  right,
}: {
  title: string;
  children: React.ReactNode;
  right?: React.ReactNode;
}) {
  return (
    <div className="border rounded-lg bg-white shadow-sm">
      <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50">
        <h3 className="font-medium">{title}</h3>
        {right}
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

/** -----------------------
 *  Main Client
 *  ---------------------- */
export default function DeliveriesClient({
  initialDeliveries,
}: {
  initialDeliveries: DeliveryClientShape[];
  initialTotal: number;
  initialPage: number;
  limit: number;
}) {
  const router = useRouter();
  const params = useSearchParams();

  // tab state
  const [tab, setTab] = useState<"byAddress" | "byOrder" | "packing">(
    "byAddress"
  );

  // filters state initialised from URL
  const [fromDate, setFromDate] = useState<string>(params.get("from") || "");
  const [toDate, setToDate] = useState<string>(params.get("to") || "");
  const [typeFilter, setTypeFilter] = useState<string>(
    params.get("type") || ""
  );
  const [q, setQ] = useState<string>(params.get("q") || "");
  const [sortBy, setSortBy] = useState<
    "deliveryDate" | "orderNumber" | "customer" | "postcode"
  >(
    (((params.get("sort") as string) || "deliveryDate") as
      | "deliveryDate"
      | "orderNumber"
      | "customer"
      | "postcode") || "deliveryDate"
  );

  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  // sync filter state to URL (replace, so back/forward and shareable)
  useEffect(() => {
    const p = new URLSearchParams();
    if (fromDate) p.set("from", fromDate);
    if (toDate) p.set("to", toDate);
    if (typeFilter) p.set("type", typeFilter);
    if (q) p.set("q", q);
    if (sortBy && sortBy !== "deliveryDate") p.set("sort", sortBy);

    const newUrl = `/dashboard/orders?${p.toString()}`;
    router.replace(newUrl);
  }, [fromDate, toDate, typeFilter, q, sortBy, router]);

  /** Filtering + sorting */
  const filteredSorted = useMemo(() => {
    let arr = [...(initialDeliveries ?? [])];

    // date range
    if (fromDate || toDate) {
      const from = fromDate ? new Date(fromDate).getTime() : 0;
      const to = toDate
        ? new Date(toDate).getTime() + 24 * 60 * 60 * 1000 - 1
        : Number.POSITIVE_INFINITY;
      arr = arr.filter((d) => {
        const t = new Date(d.deliveryDate).getTime();
        return t >= from && t <= to;
      });
    }

    // item-type
    if (typeFilter) {
      arr = arr.filter((d) =>
        itemsForDelivery(d).some((it) => (it.itemType || "") === typeFilter)
      );
    }

    // text search
    if (q.trim()) {
      const needle = q.trim().toLowerCase();
      arr = arr.filter((d) => {
        const addr = d.order.deliveryAddress || {};
        const post = String(
          (addr["postal_code"] as string | undefined) ||
            (addr["postcode"] as string | undefined) ||
            (addr["zip"] as string | undefined) ||
            ""
        ).toLowerCase();

        return (
          d.order.orderNumber.toLowerCase().includes(needle) ||
          (d.order.customerEmail || "").toLowerCase().includes(needle) ||
          post.includes(needle)
        );
      });
    }

    // sorting
    arr.sort((a, b) => {
      switch (sortBy) {
        case "deliveryDate":
          return (
            new Date(a.deliveryDate).getTime() -
            new Date(b.deliveryDate).getTime()
          );
        case "orderNumber":
          return a.order.orderNumber.localeCompare(b.order.orderNumber);
        case "customer":
          return (a.order.customerEmail || "").localeCompare(
            b.order.customerEmail || ""
          );
        case "postcode": {
          const ap = String(
            (a.order.deliveryAddress?.["postal_code"] as string | undefined) ||
              (a.order.deliveryAddress?.["postcode"] as string | undefined) ||
              ""
          );
          const bp = String(
            (b.order.deliveryAddress?.["postal_code"] as string | undefined) ||
              (b.order.deliveryAddress?.["postcode"] as string | undefined) ||
              ""
          );
          return ap.localeCompare(bp);
        }
        default:
          return 0;
      }
    });

    return arr;
  }, [initialDeliveries, fromDate, toDate, typeFilter, q, sortBy]);

  /** Group by address */
  const byAddress = useMemo(() => {
    const groups: Record<
      string,
      { address: Record<string, unknown>; deliveries: DeliveryClientShape[] }
    > = {};
    for (const d of filteredSorted) {
      const key = addressKeyFrom(d.order);
      if (!groups[key])
        groups[key] = {
          address: d.order.deliveryAddress || {},
          deliveries: [],
        };
      groups[key].deliveries.push(d);
    }
    return groups;
  }, [filteredSorted]);

  /** Packing aggregation (product + exact addons) */
  const packingGroups = useMemo(() => {
    type GroupKey = string;
    type Group = {
      key: GroupKey;
      product: string;
      addons: string[];
      totalQty: number;
    };
    const map = new Map<GroupKey, Group>();

    for (const d of filteredSorted) {
      for (const it of itemsForDelivery(d)) {
        const addonNames = (it.addons || []).map((a) => a.name).sort();
        const key = `${it.product.name}|${addonNames.join("+")}`;
        const qty = it.quantity || 0;
        const existing = map.get(key);
        if (existing) existing.totalQty += qty;
        else
          map.set(key, {
            key,
            product: it.product.name,
            addons: addonNames,
            totalQty: qty,
          });
      }
    }

    return Array.from(map.values()).sort((a, b) =>
      a.product.localeCompare(b.product)
    );
  }, [filteredSorted]);

  /** Render */
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Delivery Dashboard</h1>
        <div className="flex gap-2">
          <PillTab
            active={tab === "byAddress"}
            onClick={() => setTab("byAddress")}
          >
            By address
          </PillTab>
          <PillTab active={tab === "byOrder"} onClick={() => setTab("byOrder")}>
            By order
          </PillTab>
          <PillTab active={tab === "packing"} onClick={() => setTab("packing")}>
            Packing
          </PillTab>
        </div>
      </div>

      <Section title="Filters">
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-xs text-gray-600">From</label>
            <input
              type="date"
              className="border px-2 py-1 rounded"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs text-gray-600">To</label>
            <input
              type="date"
              className="border px-2 py-1 rounded"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs text-gray-600">Item type</label>
            <select
              className="border px-2 py-1 rounded"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="">All</option>
              <option value="ONE_TIME">ONE_TIME</option>
              <option value="WEEKLY_PLAN">WEEKLY_PLAN</option>
              <option value="CUSTOM_DAYS">CUSTOM_DAYS</option>
            </select>
          </div>

          <div>
            <label className="block text-xs text-gray-600">
              Search (order/email/postcode)
            </label>
            <input
              className="border px-2 py-1 rounded"
              placeholder="ORD123 / alice@ / SW1A"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs text-gray-600">Sort by</label>
            <select
              className="border px-2 py-1 rounded"
              value={sortBy}
              onChange={(e) =>
                setSortBy(
                  e.target.value as
                    | "deliveryDate"
                    | "orderNumber"
                    | "customer"
                    | "postcode"
                )
              }
            >
              <option value="deliveryDate">Delivery date</option>
              <option value="orderNumber">Order number</option>
              <option value="customer">Customer</option>
              <option value="postcode">Postcode</option>
            </select>
          </div>

          <button
            onClick={() => {
              setFromDate("");
              setToDate("");
              setTypeFilter("");
              setQ("");
              setSortBy("deliveryDate");
            }}
            className="border px-3 py-1 rounded"
          >
            Clear
          </button>
        </div>
      </Section>

      {tab === "byAddress" && (
        <ByAddressView
          byAddress={byAddress}
          expanded={expanded}
          setExpanded={setExpanded}
        />
      )}
      {tab === "byOrder" && <ByOrderView deliveries={filteredSorted} />}
      {tab === "packing" && <PackingView groups={packingGroups} />}
    </div>
  );
}

/** -----------------------
 *  Separate view components
 *  ---------------------- */
function ByAddressView({
  byAddress,
  expanded,
  setExpanded,
}: {
  byAddress: Record<
    string,
    { address: Record<string, unknown>; deliveries: DeliveryClientShape[] }
  >;
  expanded: Record<string, boolean>;
  setExpanded: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
}) {
  const cards = Object.entries(byAddress);
  if (cards.length === 0)
    return <div className="text-gray-500">No deliveries found.</div>;

  return (
    <div className="space-y-4">
      {cards.map(([key, group]) => {
        const { title, subtitle } = addressLabel(group.address);
        const open = !!expanded[key];
        const totalItems = group.deliveries.reduce(
          (s, d) =>
            s +
            itemsForDelivery(d).reduce((a, it) => a + (it.quantity || 0), 0),
          0
        );

        return (
          <div key={key} className="border rounded-lg bg-white shadow-sm">
            <div className="flex justify-between items-center p-4 border-b">
              <div>
                <div className="font-medium">{title}</div>
                <div className="text-sm text-gray-600">{subtitle}</div>
                <div className="text-sm text-gray-600">
                  Deliveries: {group.deliveries.length} · Items: {totalItems}
                </div>
              </div>
              <button
                onClick={() => setExpanded((s) => ({ ...s, [key]: !s[key] }))}
                className="border px-3 py-1 rounded text-sm"
              >
                {open ? "Collapse" : "Expand"}
              </button>
            </div>

            {open && (
              <div className="p-4 space-y-3">
                {group.deliveries.map((d) => (
                  <div key={d.id} className="border rounded bg-gray-50 p-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-sm font-medium">
                          Order #{d.order.orderNumber}
                        </div>
                        <div className="text-xs text-gray-600">
                          {d.order.customerEmail}
                        </div>
                        <div className="text-xs text-gray-600">
                          Delivery: {new Date(d.deliveryDate).toLocaleString()}
                        </div>
                      </div>
                      <div className="text-sm">{d.status}</div>
                    </div>

                    <div className="mt-2 overflow-auto">
                      <table className="w-full text-sm">
                        <thead className="text-xs text-gray-600 bg-white border-b">
                          <tr>
                            <th className="text-left px-2 py-1">Item</th>
                            <th className="text-left px-2 py-1">Qty</th>
                            <th className="text-left px-2 py-1">Addons</th>
                            <th className="text-left px-2 py-1">Type</th>
                            <th className="text-left px-2 py-1">Price</th>
                          </tr>
                        </thead>
                        <tbody>
                          {itemsForDelivery(d).map((it) => (
                            <tr key={it.id} className="border-t">
                              <td className="px-2 py-1">{it.product.name}</td>
                              <td className="px-2 py-1">{it.quantity}</td>
                              <td className="px-2 py-1">
                                {it.addons.length
                                  ? it.addons.map((a) => a.name).join(", ")
                                  : "—"}
                              </td>
                              <td className="px-2 py-1">
                                {it.itemType || "—"}
                              </td>
                              <td className="px-2 py-1">
                                {formatCurrency(it.unitPricePence)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function ByOrderView({ deliveries }: { deliveries: DeliveryClientShape[] }) {
  if (deliveries.length === 0)
    return <div className="text-gray-500">No deliveries found.</div>;

  return (
    <Section title="Orders">
      <table className="w-full border text-sm">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-2 text-left">Order</th>
            <th className="p-2 text-left">Customer</th>
            <th className="p-2 text-left">Delivery date</th>
            <th className="p-2 text-left">Items</th>
            <th className="p-2 text-left">Status</th>
          </tr>
        </thead>
        <tbody>
          {deliveries.map((d) => (
            <tr key={d.id} className="border-t align-top">
              <td className="p-2">{d.order.orderNumber}</td>
              <td className="p-2">{d.order.customerEmail}</td>
              <td className="p-2">
                {new Date(d.deliveryDate).toLocaleString()}
              </td>
              <td className="p-2">
                {itemsForDelivery(d).map((it) => (
                  <div key={it.id} className="text-sm">
                    {it.product.name} × {it.quantity}{" "}
                    {it.addons.length
                      ? `(+ ${it.addons.map((a) => a.name).join(", ")})`
                      : ""}
                  </div>
                ))}
              </td>
              <td className="p-2">{d.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Section>
  );
}

function PackingView({
  groups,
}: {
  groups: {
    key: string;
    product: string;
    addons: string[];
    totalQty: number;
  }[];
}) {
  if (groups.length === 0)
    return <div className="text-gray-500">No items to pack.</div>;

  return (
    <Section title="Packing summary">
      <table className="w-full border text-sm">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-2 text-left">Product</th>
            <th className="p-2 text-left">Add-ons</th>
            <th className="p-2 text-left">Total quantity</th>
          </tr>
        </thead>
        <tbody>
          {groups.map((g) => (
            <tr key={g.key} className="border-t">
              <td className="p-2 font-medium">{g.product}</td>
              <td className="p-2">
                {g.addons.length ? g.addons.join(", ") : "—"}
              </td>
              <td className="p-2">{g.totalQty}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Section>
  );
}
