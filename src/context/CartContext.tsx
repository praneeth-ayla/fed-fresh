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
  pricePence: number; // Price per delivery
  quantity: number;
  slug?: string;
  addons?: CartAddon[];
  orderType: "ONE_TIME" | "WEEKLY_PLAN" | "CUSTOM_DAYS";
  deliveryDates: string[];
  categoryId?: number;
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

  // discount
  appliedDiscountCode: string | null;
  discountAmountPence: number;
  discountData: {
    code: string;
    description?: string;
  } | null;

  // totals
  discountedTotal: number;
  finalTotal: number;

  // functions
  applyDiscount: (
    code: string
  ) => Promise<{ success: boolean; message?: string }>;
  removeDiscount: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [appliedDiscountCode, setAppliedDiscountCode] = useState<string | null>(
    null
  );
  const [discountAmountPence, setDiscountAmountPence] = useState<number>(0);
  const [discountData, setDiscountData] = useState<{
    code: string;
    description?: string;
  } | null>(null);

  // Load cart from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("cart");
      if (saved) setItems(JSON.parse(saved));
    } catch {
      localStorage.removeItem("cart");
    }
  }, []);

  // Persist cart to localStorage
  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(items));
  }, [items]);

  // Unique key for cart items (based on product + addons + dates)
  const generateKey = (item: Omit<CartItem, "uniqueKey">) => {
    const addonIds =
      item.addons
        ?.map((a) => a.id)
        .sort((a, b) => a - b)
        .join(",") ?? "";
    const datesKey = item.deliveryDates.sort().join(",");
    return `${item.id}-${addonIds}-${item.orderType}-${datesKey}`;
  };

  // Add item to cart
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

  // Remove item
  const removeItem = (uniqueKey: string) => {
    setItems((prev) => prev.filter((i) => i.uniqueKey !== uniqueKey));
  };

  // Update quantity
  const updateQuantity = (uniqueKey: string, quantity: number) => {
    setItems((prev) =>
      prev.map((i) =>
        i.uniqueKey === uniqueKey
          ? { ...i, quantity: Math.max(1, quantity) }
          : i
      )
    );
  };

  // Clear cart and reset discount
  const clearCart = () => {
    setItems([]);
    localStorage.removeItem("cart");
    setAppliedDiscountCode(null);
    setDiscountAmountPence(0);
    setDiscountData(null);
  };

  // Subtotal calculation
  const totalPrice = items.reduce((sum, item) => {
    const addonsPrice = item.addons?.reduce((a, b) => a + b.pricePence, 0) ?? 0;
    const pricePerDelivery = item.pricePence + addonsPrice;
    const totalForItem =
      pricePerDelivery * item.quantity * item.deliveryDates.length;
    return sum + totalForItem;
  }, 0);

  // Total deliveries count
  const totalDeliveries = items.reduce(
    (sum, item) => sum + item.deliveryDates.length,
    0
  );

  // Discounted subtotal
  const discountedTotal = Math.max(0, totalPrice - discountAmountPence);

  // Final total after discount
  const finalTotal = discountedTotal;

  // Apply discount (server validation)
  const applyDiscount = async (code: string) => {
    try {
      const res = await fetch("/api/discounts/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, items }),
      });

      const data = await res.json();

      if (!res.ok || !data.valid) {
        return { success: false, message: data?.message ?? "Invalid code" };
      }

      setAppliedDiscountCode(code);
      setDiscountAmountPence(data.discountAmountPence ?? 0);
      setDiscountData({
        code: data.discount?.code,
        description: data.discount?.description,
      });

      return { success: true, message: "Discount applied" };
    } catch (err) {
      console.error("applyDiscount error:", err);
      return { success: false, message: "Something went wrong" };
    }
  };

  // Remove discount
  const removeDiscount = () => {
    setAppliedDiscountCode(null);
    setDiscountAmountPence(0);
    setDiscountData(null);
  };

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
        appliedDiscountCode,
        discountAmountPence,
        discountData,
        discountedTotal,
        finalTotal,
        applyDiscount,
        removeDiscount,
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
