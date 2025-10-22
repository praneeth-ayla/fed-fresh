"use client";

import { useState } from "react";
import { useCart } from "@/context/CartContext";
import { ProductWithImagesAndAddons } from "@/types/db";

/**
 * @description Client-side component for displaying a product, selecting addons,
 * calculating total price, and adding the product to the cart.
 */
export default function ProductClient({
  product,
}: {
  product: ProductWithImagesAndAddons;
}) {
  const { addItem } = useCart();

  // State for selected addons
  const [selectedAddons, setSelectedAddons] = useState<
    { id: string; name: string; pricePence: number }[]
  >([]);

  /**
   * Toggle addon selection
   */
  const handleAddonToggle = (addon: {
    id: string | number;
    name: string;
    pricePence: number;
  }) => {
    setSelectedAddons((prev) => {
      const exists = prev.find((a) => a.id === String(addon.id));
      if (exists) {
        return prev.filter((a) => a.id !== String(addon.id));
      } else {
        return [
          ...prev,
          {
            id: String(addon.id),
            name: addon.name,
            pricePence: addon.pricePence,
          },
        ];
      }
    });
  };

  /**
   * Add product with selected addons to cart
   */
  const handleAdd = () => {
    addItem({
      id: String(product.id),
      name: product.name,
      pricePence: product.basePricePence,
      quantity: 1,
      slug: product.slug,
      addons: selectedAddons,
    });
  };

  // Calculate total price including addons
  const totalPrice =
    product.basePricePence +
    selectedAddons.reduce((sum, a) => sum + a.pricePence, 0);

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-semibold">{product.name}</h1>
      <p className="text-gray-600 mt-2">£{(totalPrice / 100).toFixed(2)}</p>

      {/* Addons selection */}
      {product.addons && product.addons.length > 0 && (
        <div className="mt-6">
          <h3 className="font-medium mb-2">Add-ons</h3>
          <div className="space-y-2">
            {product.addons.map((addon) => {
              const isSelected = selectedAddons.some(
                (a) => a.id === String(addon.id)
              );

              return (
                <label
                  key={addon.id}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() =>
                      handleAddonToggle({
                        id: addon.id,
                        name: addon.name,
                        pricePence: addon.pricePence,
                      })
                    }
                  />
                  <span>{addon.name}</span>
                  {addon.pricePence > 0 && (
                    <span className="text-gray-500 text-sm">
                      +£{(addon.pricePence / 100).toFixed(2)}
                    </span>
                  )}
                </label>
              );
            })}
          </div>
        </div>
      )}

      <button
        onClick={handleAdd}
        className="mt-6 bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-md"
      >
        Add to Cart
      </button>
    </div>
  );
}
