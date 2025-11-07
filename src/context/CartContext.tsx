"use client";

import { createContext, useContext, useEffect, useState } from "react";

export interface CartAddon {
  id: number;
  name: string;
  pricePence: number;
}

export interface CartItem {
  id: number;
  name: string;
  pricePence: number; // Price PER DELIVERY
  quantity: number; // Quantity PER DELIVERY
  slug?: string;
  addons?: CartAddon[];
  orderType: "ONE_TIME" | "WEEKLY_PLAN" | "CUSTOM_DAYS";
  deliveryDates: string[];
  uniqueKey: string;
  notes?: string;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "uniqueKey">) => void;
  removeItem: (uniqueKey: string) => void;
  clearCart: () => void;
  updateQuantity: (uniqueKey: string, quantity: number) => void;
  totalPrice: number;
  totalDeliveries: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  // Load from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("cart");
      if (saved) setItems(JSON.parse(saved));
    } catch {
      localStorage.removeItem("cart");
    }
  }, []);

  // Persist cart
  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(items));
  }, [items]);

  // Unique key generation
  const generateKey = (item: Omit<CartItem, "uniqueKey">) => {
    const addonIds =
      item.addons
        ?.map((a) => a.id)
        .sort((a, b) => a - b)
        .join(",") ?? "";
    const datesKey = item.deliveryDates.sort().join(",");
    return `${item.id}-${addonIds}-${item.orderType}-${datesKey}`;
  };

  const addItem = (item: Omit<CartItem, "uniqueKey">) => {
    const key = generateKey(item);
    setItems((prev) => {
      const existing = prev.find((p) => p.uniqueKey === key);
      if (existing) {
        return prev.map((p) =>
          p.uniqueKey === key
            ? { ...p, quantity: p.quantity + item.quantity }
            : p
        );
      } else {
        return [...prev, { ...item, uniqueKey: key }];
      }
    });
  };

  const removeItem = (uniqueKey: string) => {
    setItems((prev) => prev.filter((i) => i.uniqueKey !== uniqueKey));
  };

  const updateQuantity = (uniqueKey: string, quantity: number) => {
    setItems((prev) =>
      prev.map((i) =>
        i.uniqueKey === uniqueKey
          ? { ...i, quantity: Math.max(1, quantity) }
          : i
      )
    );
  };

  const clearCart = () => {
    setItems([]);
    localStorage.removeItem("cart");
  };

  // Calculate total price (price per delivery × quantity × number of deliveries)
  const totalPrice = items.reduce((sum, item) => {
    const addonsPrice = item.addons?.reduce((a, b) => a + b.pricePence, 0) ?? 0;
    const pricePerDelivery = item.pricePence + addonsPrice;
    const totalForItem =
      pricePerDelivery * item.quantity * item.deliveryDates.length;
    return sum + totalForItem;
  }, 0);

  // Calculate total number of deliveries across all items
  const totalDeliveries = items.reduce((sum, item) => {
    return sum + item.deliveryDates.length;
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
        totalDeliveries,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
