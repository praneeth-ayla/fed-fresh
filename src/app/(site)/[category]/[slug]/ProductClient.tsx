"use client";

import { useState } from "react";
import { useCart } from "@/context/CartContext";
import { ProductWithImagesAndAddons } from "@/types/db";
import ImagesCarousel from "@/components/ImagesCarousel";

type OrderType = "ONE_TIME" | "WEEKLY_PLAN" | "CUSTOM_DAYS";

export default function ProductClient({
  product,
}: {
  product: ProductWithImagesAndAddons;
}) {
  const { addItem } = useCart();

  const [selectedFreeAddons, setSelectedFreeAddons] = useState<number[]>([]);
  const [selectedPaidAddons, setSelectedPaidAddons] = useState<number[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [orderType, setOrderType] = useState<OrderType>("ONE_TIME");

  // ONE_TIME: single date
  const [selectedDate, setSelectedDate] = useState("");

  // WEEKLY_PLAN: start date and number of weeks
  const [startDate, setStartDate] = useState("");
  const [weeks, setWeeks] = useState(1);

  // CUSTOM_DAYS: multiple individual dates
  const [customDates, setCustomDates] = useState<string[]>([]);
  const [newCustomDate, setNewCustomDate] = useState("");

  const [instructions, setInstructions] = useState("");

  const freeAddons = product.addons.filter((a) => a.pricePence === 0);
  const paidAddons = product.addons.filter((a) => a.pricePence > 0);

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

  const selectedPaidAddonObjects = paidAddons.filter((a) =>
    selectedPaidAddons.includes(a.id)
  );

  // Generate weekdays (Monday to Friday) for weekly plan
  const generateWeekdayDates = (
    start: string,
    numberOfWeeks: number
  ): string[] => {
    if (!start) return [];

    const dates: string[] = [];
    const startDate = new Date(start);

    // Find the next Monday if start date is not Monday
    const dayOfWeek = startDate.getDay();
    const daysUntilMonday =
      dayOfWeek === 0 ? 1 : dayOfWeek === 1 ? 0 : 8 - dayOfWeek;
    const firstMonday = new Date(startDate);
    firstMonday.setDate(startDate.getDate() + daysUntilMonday);

    for (let week = 0; week < numberOfWeeks; week++) {
      for (let day = 0; day < 5; day++) {
        // Monday to Friday (5 days)
        const currentDate = new Date(firstMonday);
        currentDate.setDate(firstMonday.getDate() + week * 7 + day);
        dates.push(currentDate.toISOString().split("T")[0]);
      }
    }

    return dates;
  };

  // Get delivery dates based on order type
  const getDeliveryDates = (): string[] => {
    switch (orderType) {
      case "ONE_TIME":
        return selectedDate ? [selectedDate] : [];
      case "WEEKLY_PLAN":
        return generateWeekdayDates(startDate, weeks);
      case "CUSTOM_DAYS":
        return customDates;
      default:
        return [];
    }
  };

  const deliveryDates = getDeliveryDates();
  const numberOfDeliveries = deliveryDates.length;

  // Calculate price PER DELIVERY
  const pricePerDelivery =
    product.basePricePence +
    selectedPaidAddonObjects.reduce((sum, a) => sum + a.pricePence, 0);

  // Total price = (price per delivery × quantity) × number of deliveries
  const totalPrice = pricePerDelivery * quantity * numberOfDeliveries;

  // Add custom date
  const handleAddCustomDate = () => {
    if (newCustomDate && !customDates.includes(newCustomDate)) {
      setCustomDates([...customDates, newCustomDate]);
      setNewCustomDate("");
    }
  };

  // Remove custom date
  const handleRemoveCustomDate = (dateToRemove: string) => {
    setCustomDates(customDates.filter((date) => date !== dateToRemove));
  };

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
      pricePence: product.basePricePence, // Price per delivery
      quantity, // Quantity per delivery
      slug: product.slug,
      addons: selectedAddons,
      orderType,
      deliveryDates,
      notes: instructions,
    });

    // Reset form or show success message
    alert(
      `Added to cart! ${quantity} item(s) for ${numberOfDeliveries} delivery(s)`
    );
  };

  return (
    <div className="p-6 max-w-3xl mx-auto border rounded-lg bg-white shadow-sm">
      {/* Image */}
      {product.images?.[0]?.url && (
        <div className="mb-4">
          <ImagesCarousel images={product.images} />
        </div>
      )}

      {/* Title & Base Price */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">{product.name}</h1>
        <span className="text-lg font-medium">
          £{(product.basePricePence / 100).toFixed(2)} per delivery
        </span>
      </div>

      {/* Description */}
      {product.description && (
        <p className="text-gray-600 mt-2">{product.description}</p>
      )}

      {/* Order Type */}
      <div className="mt-6">
        <h3 className="font-medium mb-2">Delivery Schedule</h3>
        <select
          value={orderType}
          onChange={(e) => setOrderType(e.target.value as OrderType)}
          className="border rounded-md px-3 py-2 w-full"
        >
          <option value="ONE_TIME">One-time Delivery</option>
          <option value="WEEKLY_PLAN">Weekly Plan (Mon-Fri)</option>
          <option value="CUSTOM_DAYS">Custom Dates</option>
        </select>
      </div>

      {/* ONE TIME */}
      {orderType === "ONE_TIME" && (
        <div className="mt-4">
          <h3 className="font-medium mb-2">Select Delivery Date</h3>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="border rounded-md px-3 py-2 w-full"
            min={new Date().toISOString().split("T")[0]}
          />
        </div>
      )}

      {/* WEEKLY PLAN */}
      {orderType === "WEEKLY_PLAN" && (
        <div className="mt-4 space-y-4">
          <h3 className="font-medium mb-2">Weekly Plan (Monday to Friday)</h3>
          <div>
            <label className="block text-sm mb-1">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="border rounded-md px-3 py-2 w-full"
              min={new Date().toISOString().split("T")[0]}
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Number of Weeks</label>
            <input
              type="number"
              min={1}
              max={12}
              value={weeks}
              onChange={(e) => setWeeks(Number(e.target.value))}
              className="border rounded-md px-3 py-2 w-20"
            />
            <p className="text-sm text-gray-500 mt-1">
              {weeks} week{weeks > 1 ? "s" : ""} = {weeks * 5} deliveries
            </p>
          </div>
        </div>
      )}

      {/* CUSTOM DAYS */}
      {orderType === "CUSTOM_DAYS" && (
        <div className="mt-4">
          <h3 className="font-medium mb-2">Select Custom Dates</h3>
          <div className="flex gap-2">
            <input
              type="date"
              value={newCustomDate}
              onChange={(e) => setNewCustomDate(e.target.value)}
              className="border rounded-md px-3 py-2 flex-1"
              min={new Date().toISOString().split("T")[0]}
            />
            <button
              onClick={handleAddCustomDate}
              className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
            >
              Add Date
            </button>
          </div>
          {customDates.length > 0 && (
            <div className="mt-3">
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                Selected Dates ({customDates.length}):
              </h4>
              <div className="flex flex-wrap gap-2">
                {customDates.map((date) => (
                  <span
                    key={date}
                    onClick={() => handleRemoveCustomDate(date)}
                    className="px-3 py-1 bg-green-100 rounded-full cursor-pointer hover:bg-green-200 text-sm flex items-center gap-1"
                  >
                    {date}
                    <span className="text-red-500">✕</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Quantity */}
      <div className="mt-4">
        <h3 className="font-medium mb-2">Quantity Per Delivery</h3>
        <div className="flex items-center gap-3">
          <div className="flex items-center border rounded-md">
            <button
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="px-3 py-1 text-lg"
            >
              –
            </button>
            <span className="px-4">{quantity}</span>
            <button
              onClick={() => setQuantity((q) => q + 1)}
              className="px-3 py-1 text-lg"
            >
              +
            </button>
          </div>
          <span className="text-sm text-gray-600">
            {quantity} item{quantity > 1 ? "s" : ""} per delivery
          </span>
        </div>
      </div>

      {/* Free Addons */}
      {freeAddons.length > 0 && (
        <div className="mt-6">
          <h3 className="font-medium mb-2">
            Free add-ons (Choose up to {product.maxFreeAddons})
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {freeAddons.map((addon) => (
              <label
                key={addon.id}
                className="flex items-center gap-2 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedFreeAddons.includes(addon.id)}
                  onChange={() => handleFreeAddonToggle(addon.id)}
                />
                {addon.name}
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Paid Addons */}
      {paidAddons.length > 0 && (
        <div className="mt-6">
          <h3 className="font-medium mb-2">Extra add-ons</h3>
          <div className="grid grid-cols-2 gap-2">
            {paidAddons.map((addon) => (
              <label
                key={addon.id}
                className="flex items-center gap-2 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedPaidAddons.includes(addon.id)}
                  onChange={() => handlePaidAddonToggle(addon.id)}
                />
                {addon.name}
                <span className="text-gray-500 text-sm">
                  +£{(addon.pricePence / 100).toFixed(2)} per delivery
                </span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="mt-6">
        <h3 className="font-medium mb-2">Order instructions</h3>
        <textarea
          placeholder="Add dietary preferences or special requests..."
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          className="w-full border rounded-md p-2"
          rows={3}
        />
      </div>

      {/* Price Summary */}
      {numberOfDeliveries > 0 && (
        <div className="mt-4 p-4 bg-blue-50 rounded-md">
          <h3 className="font-medium text-blue-800 mb-2">Order Summary</h3>
          <div className="text-sm text-blue-600 space-y-1">
            <p>Price per delivery: £{(pricePerDelivery / 100).toFixed(2)}</p>
            <p>Quantity per delivery: {quantity}</p>
            <p>Number of deliveries: {numberOfDeliveries}</p>
            <p className="font-medium mt-2">
              Total: £{(totalPrice / 100).toFixed(2)}
            </p>
          </div>
        </div>
      )}

      {/* Delivery Dates Preview */}
      {deliveryDates.length > 0 && (
        <div className="mt-4 p-3 bg-gray-50 rounded-md">
          <h3 className="font-medium text-gray-800 mb-2">Delivery Dates</h3>
          <div className="text-sm text-gray-600 max-h-32 overflow-y-auto">
            {deliveryDates.map((date, index) => (
              <div key={date} className="flex justify-between py-1">
                <span>Delivery {index + 1}:</span>
                <span>{date}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add to Cart */}
      <button
        onClick={handleAddToCart}
        disabled={deliveryDates.length === 0}
        className="mt-6 w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium py-3 rounded-md transition-colors"
      >
        {deliveryDates.length === 0
          ? "Select Delivery Dates"
          : `Add to Cart - £${(totalPrice / 100).toFixed(
              2
            )} (${numberOfDeliveries} deliveries)`}
      </button>
    </div>
  );
}
