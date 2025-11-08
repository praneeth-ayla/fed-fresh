"use client";

import { useState } from "react";
import { useCart } from "@/context/CartContext";
import { ProductWithImagesAndAddons } from "@/types/db";
import { Badge } from "./ui/badge";
import DateSelector from "./DateSelector";

type OrderType = "ONE_TIME" | "WEEKLY_PLAN" | "CUSTOM_DAYS";

export default function ProductOrderCard({
  product,
}: {
  product: ProductWithImagesAndAddons;
}) {
  const { addItem } = useCart();

  // States for order plan and delivery management
  const [orderType, setOrderType] = useState<OrderType>("ONE_TIME");
  const [deliveryDates, setDeliveryDates] = useState<string[]>([]);
  const [showDateSelector, setShowDateSelector] = useState(false);
  const [weeks, setWeeks] = useState(1);

  // Add-ons and quantity
  const [selectedFreeAddons, setSelectedFreeAddons] = useState<number[]>([]);
  const [selectedPaidAddons, setSelectedPaidAddons] = useState<number[]>([]);
  const [quantity, setQuantity] = useState(1);

  // Notes
  const [instructions, setInstructions] = useState("");

  // Derived lists
  const freeAddons = product.addons.filter((a) => a.pricePence === 0);
  const paidAddons = product.addons.filter((a) => a.pricePence > 0);

  // Handle date selection from DateSelector
  const handleDatesChange = (dates: string[]) => {
    setDeliveryDates(dates);
  };

  // Reset delivery dates when order type changes
  const handleOrderTypeChange = (newOrderType: OrderType) => {
    setOrderType(newOrderType);
    setDeliveryDates([]);
    if (newOrderType === "WEEKLY_PLAN") {
      setWeeks(1);
    }
  };

  // Update weeks and regenerate dates for weekly plan
  const handleWeeksChange = (newWeeks: number) => {
    setWeeks(newWeeks);
    // Dates will be regenerated in DateSelector via useEffect
  };

  // --- Logic for handling addons ---
  const handleFreeAddonToggle = (id: number) => {
    if (selectedFreeAddons.includes(id)) {
      setSelectedFreeAddons(selectedFreeAddons.filter((a) => a !== id));
    } else if (selectedFreeAddons.length < product.maxFreeAddons) {
      setSelectedFreeAddons([...selectedFreeAddons, id]);
    }
  };

  const handlePaidAddonToggle = (id: number) => {
    if (selectedPaidAddons.includes(id)) {
      setSelectedPaidAddons(selectedPaidAddons.filter((a) => a !== id));
    } else {
      setSelectedPaidAddons([...selectedPaidAddons, id]);
    }
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
    <div className="px-4 flex flex-col gap-6">
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

      {/* Order Plan with Calendar Button */}
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <h3 className="font-bold text-base mb-2">Order Plan</h3>
          <select
            value={orderType}
            className="p-2 border-2 border-gray-300 rounded-lg w-full"
            onChange={(e) => handleOrderTypeChange(e.target.value as OrderType)}
          >
            <option value="ONE_TIME">One-time</option>
            <option value="WEEKLY_PLAN">Weekly</option>
            <option value="CUSTOM_DAYS">Custom</option>
          </select>
        </div>
        <button
          onClick={() => setShowDateSelector(true)}
          className="mt-6 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
        >
          Select Dates
        </button>
      </div>

      {/* Weeks selector for weekly plan - Show even when no dates selected */}
      {orderType === "WEEKLY_PLAN" && (
        <div className="mt-4">
          <label className="block text-sm font-medium mb-2">
            Number of Weeks
          </label>
          <input
            type="number"
            min={1}
            max={12}
            value={weeks}
            onChange={(e) => handleWeeksChange(Number(e.target.value))}
            className="border rounded-md px-3 py-2 w-20"
          />
          <p className="text-sm text-gray-500 mt-1">
            {weeks} week{weeks > 1 ? "s" : ""} = {weeks * 5} deliveries
          </p>
        </div>
      )}

      {/* Date Selector Modal */}
      {showDateSelector && (
        <DateSelector
          orderType={orderType}
          onDatesChange={handleDatesChange}
          onClose={() => setShowDateSelector(false)}
          initialDates={deliveryDates}
          weeks={weeks}
        />
      )}

      {/* Selected Dates Display */}
      {deliveryDates.length > 0 && (
        <div className="mt-4 p-4 border rounded-lg bg-gray-50">
          <h3 className="font-medium mb-2">Selected Delivery Dates:</h3>
          <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
            {deliveryDates.map((date) => (
              <span
                key={date}
                className="px-3 py-1 bg-green-100 rounded-full text-sm"
              >
                {date}
              </span>
            ))}
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Total: {deliveryDates.length} delivery
            {deliveryDates.length > 1 ? "s" : ""}
          </p>
        </div>
      )}

      {/* Quantity */}
      <div>
        <h3 className="font-bold text-base mb-2">Order Quantity</h3>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            className="w-10 h-10 rounded-full border-2 border-gray-300 flex items-center justify-center hover:bg-gray-100"
          >
            -
          </button>
          <span className="text-lg font-medium">{quantity}</span>
          <button
            onClick={() => setQuantity((q) => q + 1)}
            className="w-10 h-10 rounded-full border-2 border-gray-300 flex items-center justify-center hover:bg-gray-100"
          >
            +
          </button>
        </div>
      </div>

      {/* Free Addons */}
      {freeAddons.length > 0 && (
        <div>
          <h3 className="font-bold text-base mb-2">
            Free Add-ons (Choose up to {product.maxFreeAddons})
          </h3>
          <div className="space-y-2">
            {freeAddons.map((addon) => (
              <label
                key={addon.id}
                className="flex items-center gap-2 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedFreeAddons.includes(addon.id)}
                  onChange={() => handleFreeAddonToggle(addon.id)}
                  className="w-4 h-4"
                />
                <span>{addon.name}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Paid Addons */}
      {paidAddons.length > 0 && (
        <div>
          <h3 className="font-bold text-base mb-2">Extra Add-ons</h3>
          <div className="space-y-2">
            {paidAddons.map((addon) => (
              <label
                key={addon.id}
                className="flex items-center gap-2 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedPaidAddons.includes(addon.id)}
                  onChange={() => handlePaidAddonToggle(addon.id)}
                  className="w-4 h-4"
                />
                <span>
                  {addon.name} +£{(addon.pricePence / 100).toFixed(2)}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Instructions */}
      <div>
        <h3 className="font-bold text-base mb-2">Order Instructions</h3>
        <textarea
          placeholder="Add dietary preferences or special requests..."
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          className="w-full border rounded-md px-3 py-2 min-h-[100px] resize-vertical"
        />
      </div>

      {/* Add to Cart */}
      <button
        onClick={handleAddToCart}
        className="bg-green-500 text-white py-3 px-6 rounded-lg font-semibold text-lg hover:bg-green-600 transition-colors"
      >
        {deliveryDates.length === 0
          ? "Select Delivery Dates"
          : `Add to Cart - £${(totalPrice / 100).toFixed(2)}`}
      </button>
    </div>
  );
}
