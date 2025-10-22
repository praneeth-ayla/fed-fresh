"use client";

import { createContext, useContext, useEffect, useState } from "react";

export interface CartAddon {
  id: string;
  name: string;
  pricePence: number;
}

export interface CartItem {
  id: string; // Product ID
  name: string;
  pricePence: number; // Base product price (without addons)
  quantity: number;
  slug?: string;
  addons?: CartAddon[];
  uniqueKey: string; // Combo key based on product + addons
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "uniqueKey">) => void;
  removeItem: (uniqueKey: string) => void;
  clearCart: () => void;
  updateQuantity: (uniqueKey: string, quantity: number) => void;
  totalPrice: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  /**
   * Load cart data from localStorage safely on mount
   * Handles corrupted data by resetting it
   */
  useEffect(() => {
    try {
      const saved = localStorage.getItem("cart");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) setItems(parsed);
      }
    } catch (err) {
      console.warn("Failed to parse cart from localStorage:", err);
      localStorage.removeItem("cart");
      setItems([]);
    }
  }, []);

  /**
   * Persist cart data to localStorage whenever `items` changes
   */
  useEffect(() => {
    try {
      localStorage.setItem("cart", JSON.stringify(items));
    } catch (err) {
      console.warn("Failed to write cart to localStorage:", err);
    }
  }, [items]);

  /**
   * Generate a deterministic unique key per product + addon combination
   * Example: "product123-addonA,addonB"
   */
  const generateKey = (item: Omit<CartItem, "uniqueKey">) => {
    const addonIds =
      item.addons
        ?.map((a) => String(a.id))
        .sort((x, y) => (x > y ? 1 : x < y ? -1 : 0))
        .join(",") ?? "";
    return `${item.id}-${addonIds}`;
  };

  /**
   * Add a product to the cart
   * - Reads the latest cart state from localStorage (prevents stale updates)
   * - Merges quantities for identical product+addon combos
   */
  const addItem = (item: Omit<CartItem, "uniqueKey">) => {
    try {
      // Fetch latest cart from localStorage before updating
      const saved = localStorage.getItem("cart");
      const currentCart: CartItem[] = saved ? JSON.parse(saved) : [];

      const incomingQuantity = Math.max(1, Number(item.quantity) || 1);
      const normalizedAddons =
        item.addons?.map((a) => ({ ...a, id: String(a.id) })) ?? [];

      const key = generateKey({ ...item, addons: normalizedAddons });

      // Check if this combo already exists
      const existing = currentCart.find((p) => p.uniqueKey === key);

      let updatedCart: CartItem[];

      if (existing) {
        // If same combo exists, just update quantity
        updatedCart = currentCart.map((p) =>
          p.uniqueKey === key
            ? { ...p, quantity: p.quantity + incomingQuantity }
            : p
        );
      } else {
        // Else, add as a new unique item
        const newItem: CartItem = {
          ...item,
          addons: normalizedAddons,
          quantity: incomingQuantity,
          uniqueKey: key,
        };
        updatedCart = [...currentCart, newItem];
      }

      // Update both React state and localStorage immediately
      setItems(updatedCart);
      localStorage.setItem("cart", JSON.stringify(updatedCart));
    } catch (err) {
      console.error("Failed to add item to cart:", err);
    }
  };

  /**
   * Remove a single item combo from the cart by uniqueKey
   */
  const removeItem = (uniqueKey: string) => {
    setItems((prev) => {
      const updated = prev.filter((p) => p.uniqueKey !== uniqueKey);
      localStorage.setItem("cart", JSON.stringify(updated));
      return updated;
    });
  };

  /**
   * Update the quantity of a specific item combo
   * Removes item if quantity <= 0
   */
  const updateQuantity = (uniqueKey: string, quantity: number) => {
    setItems((prev) => {
      let updated;
      if (quantity <= 0) {
        updated = prev.filter((p) => p.uniqueKey !== uniqueKey);
      } else {
        updated = prev.map((p) =>
          p.uniqueKey === uniqueKey ? { ...p, quantity } : p
        );
      }
      localStorage.setItem("cart", JSON.stringify(updated));
      return updated;
    });
  };

  /**
   * Clear the entire cart (used after successful order placement)
   */
  const clearCart = () => {
    setItems([]);
    localStorage.removeItem("cart");
  };

  /**
   * Compute total price including addons and quantities
   */
  const totalPrice = items.reduce((sum, i) => {
    const addonsPrice = i.addons?.reduce((a, b) => a + b.pricePence, 0) ?? 0;
    return sum + (i.pricePence + addonsPrice) * i.quantity;
  }, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        clearCart,
        updateQuantity,
        totalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

/**
 * Hook for accessing the cart context safely
 */
export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used inside CartProvider");
  return context;
}
