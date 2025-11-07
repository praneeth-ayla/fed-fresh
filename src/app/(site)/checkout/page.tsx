"use client";

import DeliveryAddressSection from "@/components/DeliveryAddressSection";
import OrderSummary from "@/components/OrderSummary";
import { useCart } from "@/context/CartContext";
import { Address, CustomerInfoProps, OrderSummaryProps } from "@/types/types";
import { useState } from "react";

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

// ------------------- Main Component -------------------

export default function CheckoutPage() {
  const { items, totalPrice, totalDeliveries } = useCart();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState<Address>({
    address_line_1: "",
    address_line_2: "",
    city: "",
    postal_code: "",
    country: "GB",
  });
  const [postcodeError, setPostcodeError] = useState("");
  const handlePlaceOrder = async () => {
    if (!validatePostcode(address.postal_code)) {
      setPostcodeError("We only deliver in Leicester (LE1–LE5)");
      return;
    }

    if (
      !email ||
      !address.address_line_1 ||
      !address.city ||
      !address.postal_code
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
          customerEmail: email,
          customerPhone: phone,
          deliveryAddress: address,
        }),
      });

      if (!res.ok) throw new Error("Failed to create order");

      const data = await res.json();
      window.location.href = data.stripeSession.url;
    } catch (err) {
      alert("Failed to place order. Try again.");
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0)
    return (
      <p className="text-center py-6 text-gray-600">Your cart is empty.</p>
    );

  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      <h2 className="text-2xl font-bold mb-6">Checkout</h2>

      {/* Customer Info */}
      <CustomerInfo
        email={email}
        phone={phone}
        setEmail={setEmail}
        setPhone={setPhone}
      />

      {/* Address Section */}
      <DeliveryAddressSection
        address={address}
        setAddress={setAddress}
        postcodeError={postcodeError}
      />

      {/* Order Summary */}
      <OrderSummary
        items={items}
        totalPrice={totalPrice}
        totalDeliveries={totalDeliveries}
      />

      <button
        onClick={handlePlaceOrder}
        disabled={loading}
        className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-md font-medium transition-colors"
      >
        {loading ? "Processing..." : `Pay £${(totalPrice / 100).toFixed(2)}`}
      </button>
    </div>
  );
}
