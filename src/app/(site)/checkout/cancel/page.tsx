"use client";

import Link from "next/link";

export default function CheckoutCancel() {
  return (
    <div className="max-w-2xl mx-auto text-center py-10 px-4">
      <div className="bg-red-100 border border-red-400 text-red-700 p-4 rounded mb-6">
        <h2 className="text-2xl font-bold mb-2">Payment Cancelled</h2>
        <p>Your payment was cancelled or not completed.</p>
        <p className="mt-2">You can try checking out again if you wish.</p>
      </div>
      <div className="flex gap-4 justify-center">
        <Link
          href="/cart"
          className="bg-blue-500 text-white px-6 py-2 rounded-md"
        >
          Return to Cart
        </Link>
        <Link href="/" className="bg-gray-500 text-white px-6 py-2 rounded-md">
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}
