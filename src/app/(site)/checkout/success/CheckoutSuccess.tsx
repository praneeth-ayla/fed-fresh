"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

export default function CheckoutSuccess() {
  const searchParams = useSearchParams();
  const [order, setOrder] = useState<{ orderId: string; sessionId: string }>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const sessionId = searchParams.get("session_id");
    const orderId = searchParams.get("order_id");

    if (sessionId && orderId) {
      // You might want to verify the payment with your API
      setOrder({ orderId, sessionId });
      setLoading(false);
    }
  }, [searchParams]);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto py-10 px-4 text-center">
        <h2 className="text-2xl font-bold mb-4">Processing your order...</h2>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-10 px-4 text-center">
      <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">
        <h2 className="text-2xl font-bold mb-2">Order Confirmed!</h2>
        <p>
          Thank you for your purchase. Your order has been successfully placed.
        </p>
        {order && <p className="mt-2 text-sm">Order ID: {order.orderId}</p>}
      </div>

      <div className="space-y-4">
        <p>You will receive a confirmation email shortly.</p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/orders"
            className="bg-blue-500 text-white px-6 py-2 rounded-md hover:bg-blue-600"
          >
            View Orders
          </Link>
          <Link
            href="/"
            className="bg-gray-500 text-white px-6 py-2 rounded-md hover:bg-gray-600"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
