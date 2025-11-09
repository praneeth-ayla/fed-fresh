"use client";

import { useState } from "react";
import { useCart } from "@/context/CartContext";
import { ProductWithImagesAndAddons } from "@/types/db";
import { Badge } from "./ui/badge";
import DateSelector from "./DateSelector";
import { ChevronDownIcon } from "lucide-react";
import { formatSingleDates, formatWeeklyRange } from "@/lib/dateUtils";
import DateBadge from "./DateBadge";
import AddonsSelector from "./AddonSelector";

type OrderType = "ONE_TIME" | "WEEKLY_PLAN" | "CUSTOM_DAYS";

export default function ProductOrderCard({
  product,
}: {
  product: ProductWithImagesAndAddons;
}) {
  const { addItem } = useCart();

  // Order plan and delivery management
  const [orderType, setOrderType] = useState<OrderType>("ONE_TIME");
  const [deliveryDates, setDeliveryDates] = useState<string[]>([]);
  const [showDateSelector, setShowDateSelector] = useState(false);

  // Quantity and notes
  const [quantity, setQuantity] = useState(1);
  const [instructions, setInstructions] = useState("");

  // Addons (these now come from AddonsSelector)
  const [selectedFreeAddons, setSelectedFreeAddons] = useState<number[]>([]);
  const [selectedPaidAddons, setSelectedPaidAddons] = useState<number[]>([]);

  // Derived lists
  const freeAddons = product.addons.filter((a) => a.pricePence === 0);
  const paidAddons = product.addons.filter((a) => a.pricePence > 0);

  // Date selection handler
  const handleDatesChange = (dates: string[]) => {
    setDeliveryDates(dates);
  };

  // Reset delivery dates on order type change
  const handleOrderTypeChange = (newOrderType: OrderType) => {
    setOrderType(newOrderType);
    setDeliveryDates([]);
  };

  // Helper: group weekly dates
  const getSelectedWeeks = (): string[] => {
    if (orderType !== "WEEKLY_PLAN" || deliveryDates.length === 0) return [];

    const weekStarts = new Set<string>();
    deliveryDates.forEach((dateStr) => {
      const date = new Date(dateStr);
      const day = date.getDay();
      const daysToSubtract = day === 0 ? 6 : day - 1;
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - daysToSubtract);
      const weekStartStr = weekStart.toISOString().split("T")[0];
      weekStarts.add(weekStartStr);
    });

    return Array.from(weekStarts).sort();
  };

  // Update addons selection from AddonsSelector
  const handleAddonsChange = (free: number[], paid: number[]) => {
    setSelectedFreeAddons(free);
    setSelectedPaidAddons(paid);
  };

  // --- Pricing ---
  const selectedPaidAddonObjects = paidAddons.filter((a) =>
    selectedPaidAddons.includes(a.id)
  );

  const pricePerDelivery =
    product.basePricePence +
    selectedPaidAddonObjects.reduce((sum, a) => sum + a.pricePence, 0);

  const totalPrice = pricePerDelivery * quantity * deliveryDates.length;

  // --- Add to Cart ---
  const handleAddToCart = () => {
    if (deliveryDates.length === 0) {
      alert("Please select at least one delivery date before adding to cart.");
      return;
    }

    const selectedAddons = [
      ...freeAddons.filter((a) => selectedFreeAddons.includes(a.id)),
      ...selectedPaidAddonObjects,
    ].map((a) => ({
      id: a.id,
      name: a.name,
      pricePence: a.pricePence,
    }));

    addItem({
      id: product.id,
      name: product.name,
      pricePence: product.basePricePence,
      quantity,
      slug: product.slug,
      addons: selectedAddons,
      orderType,
      deliveryDates,
      notes: instructions,
    });

    alert(
      `Added to cart! ${quantity} item(s) for ${deliveryDates.length} delivery(s)`
    );
  };

  return (
    <div className="flex flex-col gap-10 min-w-2xl max-w-5xl text-[#333333]">
      {/* Product Title and Price */}
      <div className="flex flex-col gap-0.5">
        <h1 className="text-4xl">{product.name}</h1>
        {product.tags && (
          <div className="flex gap-2">
            {product.tags?.split(",").map((tag, id) => (
              <Badge
                className="bg-primary/25 border-primary text-sm font-normal px-3.5 py-1 capitalize"
                key={id}
              >
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </div>
      <p className="text-2xl font-bold">
        £{(product.basePricePence / 100).toFixed(2)}
      </p>

      {/* Description */}
      {product.description && <p>{product.description}</p>}

      <div className="flex flex-col gap-2">
        <div className="flex flex-col gap-2">
          <h3 className="font-bold text-base">Order Plan</h3>
          <div className="flex gap-4">
            <div className="relative max-w-32 w-full">
              <select
                value={orderType}
                className="p-2 border-2 border-gray-300 rounded-lg w-full appearance-none pr-8"
                onChange={(e) =>
                  handleOrderTypeChange(e.target.value as OrderType)
                }
              >
                <option value="ONE_TIME">One-time</option>
                <option value="WEEKLY_PLAN">Weekly</option>
                <option value="CUSTOM_DAYS">Custom</option>
              </select>

              <ChevronDownIcon className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 pointer-events-none text-gray-500" />
            </div>

            <button onClick={() => setShowDateSelector(true)}>
              <svg
                width="18"
                height="20"
                viewBox="0 0 18 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M16.5 1.5H14.25V0.75C14.25 0.551088 14.171 0.360322 14.0303 0.21967C13.8897 0.0790176 13.6989 0 13.5 0C13.3011 0 13.1103 0.0790176 12.9697 0.21967C12.829 0.360322 12.75 0.551088 12.75 0.75V1.5H5.25V0.75C5.25 0.551088 5.17098 0.360322 5.03033 0.21967C4.88968 0.0790176 4.69891 0 4.5 0C4.30109 0 4.11032 0.0790176 3.96967 0.21967C3.82902 0.360322 3.75 0.551088 3.75 0.75V1.5H1.5C1.10218 1.5 0.720644 1.65804 0.43934 1.93934C0.158035 2.22064 0 2.60218 0 3V18C0 18.3978 0.158035 18.7794 0.43934 19.0607C0.720644 19.342 1.10218 19.5 1.5 19.5H16.5C16.8978 19.5 17.2794 19.342 17.5607 19.0607C17.842 18.7794 18 18.3978 18 18V3C18 2.60218 17.842 2.22064 17.5607 1.93934C17.2794 1.65804 16.8978 1.5 16.5 1.5ZM3.75 3V3.75C3.75 3.94891 3.82902 4.13968 3.96967 4.28033C4.11032 4.42098 4.30109 4.5 4.5 4.5C4.69891 4.5 4.88968 4.42098 5.03033 4.28033C5.17098 4.13968 5.25 3.94891 5.25 3.75V3H12.75V3.75C12.75 3.94891 12.829 4.13968 12.9697 4.28033C13.1103 4.42098 13.3011 4.5 13.5 4.5C13.6989 4.5 13.8897 4.42098 14.0303 4.28033C14.171 4.13968 14.25 3.94891 14.25 3.75V3H16.5V6H1.5V3H3.75ZM16.5 18H1.5V7.5H16.5V18ZM10.125 10.875C10.125 11.0975 10.059 11.315 9.9354 11.5C9.81179 11.685 9.63608 11.8292 9.43052 11.9144C9.22495 11.9995 8.99875 12.0218 8.78052 11.9784C8.56229 11.935 8.36184 11.8278 8.2045 11.6705C8.04717 11.5132 7.94002 11.3127 7.89662 11.0945C7.85321 10.8762 7.87549 10.65 7.96064 10.4445C8.04578 10.2389 8.18998 10.0632 8.37498 9.9396C8.55999 9.81598 8.7775 9.75 9 9.75C9.29837 9.75 9.58452 9.86853 9.79549 10.0795C10.0065 10.2905 10.125 10.5766 10.125 10.875ZM14.25 10.875C14.25 11.0975 14.184 11.315 14.0604 11.5C13.9368 11.685 13.7611 11.8292 13.5555 11.9144C13.35 11.9995 13.1238 12.0218 12.9055 11.9784C12.6873 11.935 12.4868 11.8278 12.3295 11.6705C12.1722 11.5132 12.065 11.3127 12.0216 11.0945C11.9782 10.8762 12.0005 10.65 12.0856 10.4445C12.1708 10.2389 12.315 10.0632 12.5 9.9396C12.685 9.81598 12.9025 9.75 13.125 9.75C13.4234 9.75 13.7095 9.86853 13.9205 10.0795C14.1315 10.2905 14.25 10.5766 14.25 10.875ZM6 14.625C6 14.8475 5.93402 15.065 5.8104 15.25C5.68679 15.435 5.51109 15.5792 5.30552 15.6644C5.09995 15.7495 4.87375 15.7718 4.65552 15.7284C4.43729 15.685 4.23684 15.5778 4.0795 15.4205C3.92217 15.2632 3.81502 15.0627 3.77162 14.8445C3.72821 14.6262 3.75049 14.4 3.83564 14.1945C3.92078 13.9889 4.06498 13.8132 4.24998 13.6896C4.43499 13.566 4.6525 13.5 4.875 13.5C5.17337 13.5 5.45952 13.6185 5.6705 13.8295C5.88147 14.0405 6 14.3266 6 14.625ZM10.125 14.625C10.125 14.8475 10.059 15.065 9.9354 15.25C9.81179 15.435 9.63608 15.5792 9.43052 15.6644C9.22495 15.7495 8.99875 15.7718 8.78052 15.7284C8.56229 15.685 8.36184 15.5778 8.2045 15.4205C8.04717 15.2632 7.94002 15.0627 7.89662 14.8445C7.85321 14.6262 7.87549 14.4 7.96064 14.1945C8.04578 13.9889 8.18998 13.8132 8.37498 13.6896C8.55999 13.566 8.7775 13.5 9 13.5C9.29837 13.5 9.58452 13.6185 9.79549 13.8295C10.0065 14.0405 10.125 14.3266 10.125 14.625ZM14.25 14.625C14.25 14.8475 14.184 15.065 14.0604 15.25C13.9368 15.435 13.7611 15.5792 13.5555 15.6644C13.35 15.7495 13.1238 15.7718 12.9055 15.7284C12.6873 15.685 12.4868 15.5778 12.3295 15.4205C12.1722 15.2632 12.065 15.0627 12.0216 14.8445C11.9782 14.6262 12.0005 14.4 12.0856 14.1945C12.1708 13.9889 12.315 13.8132 12.5 13.6896C12.685 13.566 12.9025 13.5 13.125 13.5C13.4234 13.5 13.7095 13.6185 13.9205 13.8295C14.1315 14.0405 14.25 14.3266 14.25 14.625Z"
                  fill="#333333"
                />
              </svg>
            </button>
          </div>
        </div>
        {orderType === "WEEKLY_PLAN" ? (
          <div className="flex gap-1">
            {getSelectedWeeks().map((weekStart, i) => {
              const formattedWeek = formatWeeklyRange(weekStart);

              return <DateBadge key={i} date={formattedWeek} />;
            })}
          </div>
        ) : (
          <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
            {formatSingleDates(deliveryDates).map((date) => (
              <DateBadge date={date} key={date} />
            ))}
          </div>
        )}
      </div>

      {/* Date Selector Modal */}
      {showDateSelector && (
        <DateSelector
          orderType={orderType}
          onDatesChange={handleDatesChange}
          onClose={() => setShowDateSelector(false)}
          initialDates={deliveryDates}
        />
      )}

      {/* Quantity */}
      <div>
        <h3 className="font-bold text-base mb-2">Order Quantity</h3>
        <div className="text-2xl flex items-center gap-8 border-2 border-gray-300 rounded-lg px-6 py-1 w-fit">
          <button
            className="hover:cursor-pointer"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
          >
            -
          </button>
          <span className="text-lg font-medium">{quantity}</span>
          <button
            className="hover:cursor-pointer"
            onClick={() => setQuantity((q) => q + 1)}
          >
            +
          </button>
        </div>
      </div>

      <AddonsSelector
        product={product}
        freeAddons={freeAddons}
        paidAddons={paidAddons}
        onChange={handleAddonsChange}
      />

      {/* Instructions */}
      <div className="max-w-2xl">
        <h3 className="font-bold text-base mb-2">Order instructions</h3>
        <textarea
          placeholder="Add dietary preferences or special requests..."
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 min-h-[100px] resize-vertical"
        />
      </div>

      {/* Add to Cart */}
      <button
        onClick={handleAddToCart}
        className="bg-primary text-white py-3 px-6 rounded-lg font-semibold text-lg hover:bg-primary/90 transition-colors hover:cursor-pointer max-w-md"
      >
        {deliveryDates.length === 0
          ? "Select Delivery Dates"
          : `Add to Cart - £${(totalPrice / 100).toFixed(2)}`}
      </button>
    </div>
  );
}
