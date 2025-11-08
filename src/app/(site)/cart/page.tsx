"use client";

import { useCart } from "@/context/CartContext";
import { useState } from "react";
import { redirect } from "next/navigation";

export default function CartPage() {
  const {
    items,
    totalPrice,
    discountedTotal,
    discountAmountPence,
    appliedDiscountCode,
    applyDiscount,
    removeDiscount,
    removeItem,
    updateQuantity,
    clearCart,
  } = useCart();

  const [coupon, setCoupon] = useState("");
  const [couponMessage, setCouponMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleApply = async () => {
    setLoading(true);
    setCouponMessage(null);
    const res = await applyDiscount(coupon.trim());
    setLoading(false);
    if (!res.success) setCouponMessage(res.message ?? "Invalid discount code");
    else setCouponMessage("Discount applied successfully");
  };

  if (items.length === 0)
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-gray-500">
        <p>Your cart is empty.</p>
      </div>
    );

  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-8 text-gray-800">Your Cart</h1>

      {/* Items list */}
      <div className="space-y-6">
        {items.map((item) => {
          const addonsPrice =
            item.addons?.reduce((a, b) => a + b.pricePence, 0) ?? 0;
          const itemTotal =
            ((item.pricePence + addonsPrice) * item.quantity) / 100;

          return (
            <div
              key={item.uniqueKey}
              className="bg-white shadow-sm border rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
            >
              <div className="flex-1">
                <p className="text-lg font-semibold text-gray-800">
                  {item.name}
                </p>
                {item.addons?.length ? (
                  <ul className="ml-4 mt-1 text-sm text-gray-600 list-disc">
                    {item.addons.map((addon) => (
                      <li key={addon.id}>
                        {addon.name} (+£{(addon.pricePence / 100).toFixed(2)})
                      </li>
                    ))}
                  </ul>
                ) : null}
                <p className="text-sm text-gray-500 mt-1">
                  Base Price: £{(item.pricePence / 100).toFixed(2)} ×{" "}
                  {item.quantity}
                </p>
                <p className="text-xs text-gray-400">
                  Deliveries: {item.deliveryDates.length}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center border rounded-md">
                  <button
                    onClick={() =>
                      updateQuantity(item.uniqueKey, item.quantity - 1)
                    }
                    className="px-3 py-1 text-gray-700 hover:bg-gray-100"
                  >
                    -
                  </button>
                  <span className="px-3 py-1 border-x text-sm text-gray-700">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() =>
                      updateQuantity(item.uniqueKey, item.quantity + 1)
                    }
                    className="px-3 py-1 text-gray-700 hover:bg-gray-100"
                  >
                    +
                  </button>
                </div>
                <p className="text-lg font-semibold text-gray-800">
                  £{itemTotal.toFixed(2)}
                </p>
              </div>

              <button
                onClick={() => removeItem(item.uniqueKey)}
                className="text-red-500 text-sm hover:underline"
              >
                Remove
              </button>
            </div>
          );
        })}
      </div>

      {/* Summary section */}
      <div className="mt-10 grid sm:grid-cols-2 gap-6">
        {/* Discount */}
        <div className="bg-white shadow-sm border rounded-xl p-5">
          <h2 className="text-lg font-semibold mb-4">Apply Discount</h2>
          <div className="flex gap-2">
            <input
              value={coupon}
              onChange={(e) => setCoupon(e.target.value)}
              placeholder="Enter discount code"
              className="flex-1 border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleApply}
              disabled={loading || !coupon.trim()}
              className={`px-4 py-2 rounded-md text-white ${
                loading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {loading ? "Applying..." : "Apply"}
            </button>
          </div>

          {appliedDiscountCode && (
            <button
              onClick={() => {
                removeDiscount();
                setCoupon("");
                setCouponMessage("Discount removed");
              }}
              className="mt-3 text-sm text-gray-600 underline"
            >
              Remove current discount
            </button>
          )}

          {couponMessage && (
            <p
              className={`mt-3 text-sm ${
                couponMessage.includes("applied")
                  ? "text-green-600"
                  : "text-red-500"
              }`}
            >
              {couponMessage}
            </p>
          )}
        </div>

        {/* Totals */}
        <div className="bg-white shadow-sm border rounded-xl p-5 space-y-2">
          <h2 className="text-lg font-semibold mb-4">Summary</h2>

          <div className="flex justify-between text-gray-600">
            <span>Subtotal</span>
            <span>£{(totalPrice / 100).toFixed(2)}</span>
          </div>

          {discountAmountPence > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Discount</span>
              <span>-£{(discountAmountPence / 100).toFixed(2)}</span>
            </div>
          )}

          <div className="flex justify-between text-xl font-semibold text-gray-800">
            <span>Total</span>
            <span>£{(discountedTotal / 100).toFixed(2)}</span>
          </div>

          <div className="flex gap-3 mt-4">
            <button
              onClick={clearCart}
              className="flex-1 bg-gray-700 hover:bg-gray-800 text-white px-5 py-2 rounded-md"
            >
              Clear Cart
            </button>
            <button
              onClick={() => redirect("/checkout")}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-md"
            >
              Checkout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
