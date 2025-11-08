"use client";

import DeliveryAddressSection from "@/components/DeliveryAddressSection";
import OrderSummary from "@/components/OrderSummary";
import { useCart } from "@/context/CartContext";
import { validatePostcode } from "@/lib/utils";
import { Address, CustomerInfoProps } from "@/types/types";
import { useState } from "react";

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

export default function CheckoutPage() {
  const {
    items,
    totalPrice,
    discountedTotal,
    discountAmountPence,
    appliedDiscountCode,
    totalDeliveries,
  } = useCart();

  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("example@gmail.com");
  const [phone, setPhone] = useState("12313212312");
  const a: Address = {
    lat: 52.63533904731663,
    lng: -1.106021272599833,
    city: "test",
    state: "England",
    country: "United Kingdom",
    fullAddress: "196 St Saviours Rd, Leicester LE5 3SH, UK",
    postal_code: "LE5 3SH",
    address_line_1: "196 Saint Saviours Road",
    address_line_2: "",
  };
  const [address, setAddress] = useState<Address>(a);

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
          discountCode: appliedDiscountCode,
          discountAmountPence,
          totalAmountPence: discountedTotal,
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
        // discountAmountPence={discountAmountPence}
        // discountedTotal={discountedTotal}
        // discountCode={appliedDiscountCode}
        totalDeliveries={totalDeliveries}
      />

      {/* Pay button */}
      <button
        onClick={handlePlaceOrder}
        disabled={loading}
        className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-md font-medium transition-colors"
      >
        {loading
          ? "Processing..."
          : `Pay £${(discountedTotal / 100).toFixed(2)}`}
      </button>
    </div>
  );
}
