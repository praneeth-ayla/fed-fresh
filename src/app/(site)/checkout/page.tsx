"use client";

import { useCart, CartItem } from "@/context/CartContext";
import { useState } from "react";
import AddressInput from "@/components/AddressInput";

// ------------------- Types -------------------
export interface Address {
  line1: string;
  city: string;
  postal_code: string;
  country: string;
  lat?: number;
  lng?: number;
  fullAddress?: string;
}

interface CustomerInfoProps {
  email: string;
  phone: string;
  setEmail: (v: string) => void;
  setPhone: (v: string) => void;
}

interface DeliveryAddressSectionProps {
  address: Address;
  setAddress: (v: Address) => void;
  postcodeError: string;
}

interface OrderSummaryProps {
  items: CartItem[];
  totalPrice: number;
  totalDeliveries: number;
}

// ------------------- Helpers -------------------
const validatePostcode = (postcode: string): boolean => {
  const validPostcodes = ["LE1", "LE2", "LE3", "LE4", "LE5"];
  const cleaned = postcode.toUpperCase().replace(/\s/g, "");
  return validPostcodes.some((prefix) => cleaned.startsWith(prefix));
};

// ------------------- Customer Info -------------------
function CustomerInfo({ email, phone, setEmail, setPhone }: CustomerInfoProps) {
  return (
    <div>
      <div className="mb-6">
        <label className="block mb-1 font-medium text-sm">Email *</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="example@email.com"
          className="w-full border rounded-md p-2"
          required
        />
      </div>

      <div className="mb-6">
        <label className="block mb-1 font-medium text-sm">Phone Number</label>
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+44 7123 456789"
          className="w-full border rounded-md p-2"
        />
      </div>
    </div>
  );
}

// ------------------- Address Section -------------------
function DeliveryAddressSection({
  address,
  setAddress,
  postcodeError,
}: DeliveryAddressSectionProps) {
  return (
    <div className="mb-6">
      <h3 className="font-medium mb-3 text-lg">Delivery Address *</h3>
      <AddressInput
        value={address}
        onChange={(addr: Address) => setAddress(addr)}
        error={postcodeError}
      />
      {postcodeError && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-600 text-sm">{postcodeError}</p>
        </div>
      )}
    </div>
  );
}

// ------------------- Order Summary -------------------
function OrderSummary({
  items,
  totalPrice,
  totalDeliveries,
}: OrderSummaryProps) {
  return (
    <div className="mb-6">
      <h3 className="font-medium mb-4 text-lg">Order Summary</h3>
      {items.map((item) => {
        const addonsTotal =
          item.addons?.reduce((s, a) => s + a.pricePence, 0) ?? 0;
        const itemTotal =
          ((item.pricePence + addonsTotal) *
            item.quantity *
            item.deliveryDates.length) /
          100;

        return (
          <div key={item.uniqueKey} className="border-b pb-4 mb-4">
            <div className="flex justify-between">
              <p className="font-medium">{item.name}</p>
              <p className="font-medium">£{itemTotal.toFixed(2)}</p>
            </div>

            <p className="text-sm text-gray-600">
              Type: {item.orderType.replace("_", " ")} • Qty: {item.quantity}{" "}
              per delivery
            </p>

            {item.deliveryDates.length > 0 && (
              <div className="mt-1">
                <p className="text-xs text-gray-500 font-medium">
                  {item.deliveryDates.length} Delivery
                  {item.deliveryDates.length > 1 ? "s" : ""}:
                </p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {item.deliveryDates.slice(0, 3).map((date) => (
                    <span
                      key={date}
                      className="text-xs bg-gray-100 px-2 py-1 rounded"
                    >
                      {date}
                    </span>
                  ))}
                  {item.deliveryDates.length > 3 && (
                    <span className="text-xs text-gray-500">
                      +{item.deliveryDates.length - 3} more
                    </span>
                  )}
                </div>
              </div>
            )}

            {item.addons?.length ? (
              <ul className="text-sm text-gray-500 ml-4 mt-1">
                {item.addons.map((a) => (
                  <li key={a.id}>
                    + {a.name} (£{(a.pricePence / 100).toFixed(2)} per delivery)
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        );
      })}

      <div className="border-t pt-4">
        <div className="flex justify-between items-center mb-2">
          <p className="text-gray-600">Total Deliveries:</p>
          <p className="text-gray-600">{totalDeliveries}</p>
        </div>
        <p className="text-lg font-bold">
          Total: £{(totalPrice / 100).toFixed(2)}
        </p>
      </div>
    </div>
  );
}

// ------------------- Main Component -------------------
export default function CheckoutPage() {
  const { items, totalPrice, totalDeliveries } = useCart();
  const [loading, setLoading] = useState(false);
  const [customerEmail, setCustomerEmail] = useState<string>("");
  const [customerPhone, setCustomerPhone] = useState<string>("");
  const [deliveryAddress, setDeliveryAddress] = useState<Address>({
    line1: "",
    city: "",
    postal_code: "",
    country: "GB",
  });
  const [postcodeError, setPostcodeError] = useState<string>("");

  const handlePlaceOrder = async (): Promise<void> => {
    if (!validatePostcode(deliveryAddress.postal_code)) {
      setPostcodeError("We only deliver in Leicester (LE1–LE5)");
      return;
    }

    if (
      !customerEmail ||
      !deliveryAddress.line1 ||
      !deliveryAddress.city ||
      !deliveryAddress.postal_code
    ) {
      alert("Please fill in all required fields");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/create-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items,
          customerEmail,
          customerPhone,
          deliveryAddress,
        }),
      });

      if (!res.ok) throw new Error("Failed to create order");

      type CreatePaymentIntentResponse = {
        stripeSession: { url: string };
      };

      const data: CreatePaymentIntentResponse = await res.json();
      window.location.href = data.stripeSession.url;
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Failed to place order. Try again.";
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <p className="text-center py-6 text-gray-600">Your cart is empty.</p>
    );
  }

  const isPostcodeValid = validatePostcode(deliveryAddress.postal_code);

  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      <h2 className="text-2xl font-bold mb-6">Checkout</h2>

      <CustomerInfo
        email={customerEmail}
        phone={customerPhone}
        setEmail={setCustomerEmail}
        setPhone={setCustomerPhone}
      />

      <DeliveryAddressSection
        address={deliveryAddress}
        setAddress={(a) => {
          setDeliveryAddress(a);
          setPostcodeError("");
        }}
        postcodeError={postcodeError}
      />

      <OrderSummary
        items={items}
        totalPrice={totalPrice}
        totalDeliveries={totalDeliveries}
      />

      <button
        onClick={handlePlaceOrder}
        disabled={loading || !isPostcodeValid}
        className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white py-3 rounded-md font-medium transition-colors"
      >
        {loading ? "Processing..." : `Pay £${(totalPrice / 100).toFixed(2)}`}
      </button>

      {!isPostcodeValid && deliveryAddress.postal_code && (
        <p className="text-red-500 text-sm mt-2 text-center">
          Please enter a valid Leicester postcode (LE1–LE5) to proceed
        </p>
      )}
    </div>
  );
}
