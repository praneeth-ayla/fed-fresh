"use client";

import { useCart } from "@/context/CartContext";
import { useState } from "react";

/**
 * @description Checkout page component.
 * Displays items in cart, order summary, and allows placing orders.
 * Pulls state and actions from CartContext.
 */
export default function CheckoutPage() {
  const { items, totalPrice, clearCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);

  /**
   * Handles placing an order.
   * Sends cart items and order info to backend.
   * Placeholder: Replace customerEmail and deliveryAddress with real form data.
   */
  const handlePlaceOrder = async () => {
    setLoading(true);

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({
            id: i.id,
            name: i.name,
            slug: i.slug ?? "",
            pricePence: i.pricePence,
            quantity: i.quantity,
            addons: i.addons ?? [],
          })),
          totalAmountPence: totalPrice,
          customerEmail: "test@example.com",
          deliveryAddress: { line1: "123 Street", city: "London" },
        }),
      });

      if (!res.ok) throw new Error("Order creation failed");

      setOrderSuccess(true);
      clearCart(); // Clear cart after successful order
    } catch (err) {
      console.error(err);
      alert("Failed to place order");
    } finally {
      setLoading(false);
    }
  };

  // Show success message after order
  if (orderSuccess) {
    return (
      <div className="p-10 text-center">
        <h1 className="text-2xl font-semibold">✅ Order Successful!</h1>
        <p className="text-gray-600 mt-2">
          Your order has been placed successfully.
        </p>
      </div>
    );
  }

  // Show empty cart message if no items
  if (items.length === 0) {
    return <p className="p-6 text-center text-gray-600">Your cart is empty.</p>;
  }

  return (
    <div className="max-w-3xl mx-auto py-10 px-4">
      <h2 className="text-xl font-semibold mb-6">Checkout</h2>

      {/* List of cart items */}
      {items.map((item) => {
        const addonsPrice =
          item.addons?.reduce((sum, a) => sum + a.pricePence, 0) ?? 0;
        const itemTotal =
          ((item.pricePence + addonsPrice) * item.quantity) / 100;

        return (
          <div key={item.uniqueKey} className="border-b pb-2 mb-4">
            <p className="font-medium">{item.name}</p>

            {/* Display selected addons */}
            {item.addons && item.addons.length > 0 && (
              <ul className="text-sm text-gray-500 ml-4 list-disc">
                {item.addons.map((a) => (
                  <li key={a.id}>
                    {a.name} +£{(a.pricePence / 100).toFixed(2)}
                  </li>
                ))}
              </ul>
            )}

            <p className="text-sm text-gray-600">
              £{(item.pricePence / 100).toFixed(2)} × {item.quantity} = £
              {itemTotal.toFixed(2)}
            </p>
          </div>
        );
      })}

      {/* Total summary */}
      <p className="text-xl font-bold mt-6">
        Total: £{(totalPrice / 100).toFixed(2)}
      </p>

      {/* Place order button */}
      <button
        onClick={handlePlaceOrder}
        disabled={loading}
        className="mt-6 bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "Placing Order..." : "Place Order"}
      </button>
    </div>
  );
}
