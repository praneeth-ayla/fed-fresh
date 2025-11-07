"use client";

import { useState } from "react";

interface Address {
  line1: string;
  city: string;
  postal_code: string;
  country: string;
}

interface AddressInputProps {
  value: Address;
  onChange: (address: Address) => void;
  error?: string;
}

// Valid Leicester postcode prefixes
const VALID_POSTCODES = ["LE1", "LE2", "LE3", "LE4", "LE5"];

export default function AddressInput({
  value,
  onChange,
  error,
}: AddressInputProps) {
  const [postcodeError, setPostcodeError] = useState("");

  const validatePostcode = (postcode: string): boolean => {
    const cleaned = postcode.toUpperCase().replace(/\s/g, "");
    return VALID_POSTCODES.some((prefix) => cleaned.startsWith(prefix));
  };

  const handleInputChange = (field: keyof Address, val: string) => {
    const updated = { ...value, [field]: val };
    onChange(updated);

    if (field === "postal_code") {
      if (val && !validatePostcode(val)) {
        setPostcodeError("We only deliver in Leicester (LE1–LE5)");
      } else {
        setPostcodeError("");
      }
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block mb-1 font-medium text-sm">
          Street Address *
        </label>
        <input
          type="text"
          placeholder="123 Main Street"
          value={value.line1}
          onChange={(e) => handleInputChange("line1", e.target.value)}
          className="w-full border rounded-md p-2"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block mb-1 font-medium text-sm">City *</label>
          <input
            type="text"
            placeholder="Leicester"
            value={value.city}
            onChange={(e) => handleInputChange("city", e.target.value)}
            className="w-full border rounded-md p-2"
            required
          />
        </div>

        <div>
          <label className="block mb-1 font-medium text-sm">Postcode *</label>
          <input
            type="text"
            placeholder="LE2 1AA"
            value={value.postal_code}
            onChange={(e) =>
              handleInputChange("postal_code", e.target.value.toUpperCase())
            }
            className="w-full border rounded-md p-2"
            required
          />
        </div>
      </div>

      {(postcodeError || error) && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-600 text-sm">{postcodeError || error}</p>
        </div>
      )}

      {value.postal_code && validatePostcode(value.postal_code) && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-md">
          <p className="text-green-600 text-sm">
            ✓ Delivery available in your area
          </p>
        </div>
      )}

      <div className="p-4 bg-blue-50 rounded-md">
        <h4 className="font-medium text-blue-800 mb-2">Delivery Area</h4>
        <p className="text-sm text-blue-600">
          We currently deliver to Leicester postcodes: LE1, LE2, LE3, LE4, LE5
        </p>
      </div>
    </div>
  );
}
