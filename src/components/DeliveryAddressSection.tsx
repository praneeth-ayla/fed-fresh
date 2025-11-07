"use client";
import { useState } from "react";
import { DeliveryAddressSectionProps } from "@/types/types";
import MapAddressPicker from "@/components/MapAddressPicker";

export default function DeliveryAddressSection({
  address,
  setAddress,
  postcodeError,
}: DeliveryAddressSectionProps) {
  const [confirmed, setConfirmed] = useState(false);

  return (
    <div className="mb-6">
      {!confirmed ? (
        <MapAddressPicker
          onConfirm={(addr) => {
            setAddress(addr);
            setConfirmed(true);
          }}
        />
      ) : (
        <div className="bg-white shadow rounded-2xl p-4">
          <h3 className="text-lg font-semibold mb-4">Delivery Address</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              value={address.address_line_1}
              onChange={(e) =>
                setAddress({ ...address, address_line_1: e.target.value })
              }
              className="border rounded-md p-2"
              placeholder="Address Line 1"
            />
            <input
              value={address.address_line_2 || ""}
              onChange={(e) =>
                setAddress({ ...address, address_line_2: e.target.value })
              }
              className="border rounded-md p-2"
              placeholder="Address Line 2"
            />
            <input
              value={address.city}
              onChange={(e) => setAddress({ ...address, city: e.target.value })}
              className="border rounded-md p-2"
              placeholder="City"
            />
            <input
              value={address.state || ""}
              onChange={(e) =>
                setAddress({ ...address, state: e.target.value })
              }
              className="border rounded-md p-2"
              placeholder="State"
            />
            <input
              value={address.postal_code}
              onChange={(e) =>
                setAddress({ ...address, postal_code: e.target.value })
              }
              className="border rounded-md p-2"
              placeholder="Postal Code"
            />
            <input
              value={address.country}
              onChange={(e) =>
                setAddress({ ...address, country: e.target.value })
              }
              className="border rounded-md p-2"
              placeholder="Country"
            />
          </div>

          <button
            onClick={() => setConfirmed(false)}
            className="mt-4 w-full text-sm font-medium text-gray-700 hover:text-gray-900 underline"
          >
            Change Location
          </button>

          {postcodeError && (
            <p className="text-red-600 text-sm mt-2">{postcodeError}</p>
          )}
        </div>
      )}
    </div>
  );
}
