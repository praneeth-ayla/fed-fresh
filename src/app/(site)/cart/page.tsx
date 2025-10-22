"use client";

import { useCart } from "@/context/CartContext";
import { redirect } from "next/navigation";

/**
 * @description Cart page component.
 * Displays cart items, allows quantity updates, removal, clearing, and checkout.
 * Pulls state and actions from CartContext.
 */
export default function CartPage() {
  const { items, totalPrice, removeItem, updateQuantity, clearCart } =
    useCart();

  // Display empty cart message if no items
  if (items.length === 0) {
    return <p className="p-6 text-center text-gray-600">Your cart is empty.</p>;
  }

  return (
    <div className="max-w-3xl mx-auto py-10 px-4">
      <h1 className="text-2xl font-semibold mb-6">Your Cart</h1>

      {/* Cart items list */}
      <div className="space-y-6">
        {items.map((item) => {
          const addonsPrice =
            item.addons?.reduce((a, b) => a + b.pricePence, 0) ?? 0;
          const itemTotal =
            ((item.pricePence + addonsPrice) * item.quantity) / 100;

          return (
            <div
              key={item.uniqueKey}
              className="border-b pb-4 flex justify-between items-start"
            >
              {/* Item details */}
              <div className="flex-1">
                <p className="font-medium">{item.name}</p>

                {/* Addons */}
                {item.addons && item.addons.length > 0 && (
                  <ul className="ml-4 mt-2 text-sm text-gray-600 list-disc">
                    {item.addons.map((addon) => (
                      <li key={addon.id}>
                        {addon.name} (+£{(addon.pricePence / 100).toFixed(2)})
                      </li>
                    ))}
                  </ul>
                )}

                <p className="text-sm text-gray-500 mt-1">
                  Base Price: £{(item.pricePence / 100).toFixed(2)}
                </p>
                <p className="text-sm text-gray-500">
                  Quantity: {item.quantity}
                </p>
              </div>

              {/* Item controls */}
              <div className="flex flex-col items-end">
                <div className="flex gap-2 mb-2">
                  <button
                    onClick={() =>
                      updateQuantity(item.uniqueKey, item.quantity - 1)
                    }
                    className="px-2 py-1 border rounded"
                  >
                    -
                  </button>
                  <button
                    onClick={() =>
                      updateQuantity(item.uniqueKey, item.quantity + 1)
                    }
                    className="px-2 py-1 border rounded"
                  >
                    +
                  </button>
                </div>
                <p className="font-semibold">£{itemTotal.toFixed(2)}</p>
                <button
                  onClick={() => removeItem(item.uniqueKey)}
                  className="text-red-500 text-sm mt-2"
                >
                  Remove
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Cart summary and actions */}
      <div className="mt-8 border-t pt-4 flex justify-between items-center">
        <p className="text-xl font-semibold">
          Total: £{(totalPrice / 100).toFixed(2)}
        </p>
        <div className="flex gap-3">
          <button
            onClick={clearCart}
            className="bg-gray-700 text-white px-5 py-2 rounded-md"
          >
            Clear Cart
          </button>
          <button
            onClick={() => redirect("/checkout")}
            className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-md"
          >
            Checkout
          </button>
        </div>
      </div>
    </div>
  );
}
