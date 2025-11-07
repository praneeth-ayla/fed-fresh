"use client";
import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api";
import { useEffect, useState, useCallback } from "react";
import { Address } from "@/types/types";
import { validatePostcode } from "@/lib/utils";

const containerStyle = { width: "100%", height: "400px", borderRadius: "16px" };

interface MapAddressPickerProps {
  onConfirm: (address: Address) => void;
}

export default function MapAddressPicker({ onConfirm }: MapAddressPickerProps) {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
    libraries: ["places"],
  });

  const [marker, setMarker] = useState<{ lat: number; lng: number } | null>(
    null
  );
  const [address, setAddress] = useState<Address | null>(null);
  const [valid, setValid] = useState(false);
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    if (!navigator.geolocation) {
      setMessage("Geolocation not supported");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setMarker(loc);
        fetchAddress(loc);
      },
      (err) => setMessage("Unable to get location: " + err.message),
      { enableHighAccuracy: true }
    );
  }, []);

  async function fetchAddress(loc: { lat: number; lng: number }) {
    setMessage("Fetching address...");
    try {
      const res = await fetch(`/api/geocode?lat=${loc.lat}&lng=${loc.lng}`);
      const data = await res.json();

      if (!data.results?.length) {
        setMessage("No address found");
        setValid(false);
        return;
      }

      const result = data.results[0];
      const comps = result.address_components;

      const addr: Address = {
        address_line_1: "",
        address_line_2: "",
        city: "",
        state: "",
        postal_code: "",
        country: "",
        lat: loc.lat,
        lng: loc.lng,
        fullAddress: result.formatted_address,
      };

      for (const comp of comps) {
        const types = comp.types;
        if (types.includes("street_number"))
          addr.address_line_1 = comp.long_name;
        if (types.includes("route"))
          addr.address_line_1 =
            `${addr.address_line_1} ${comp.long_name}`.trim();
        if (types.includes("sublocality") || types.includes("neighborhood"))
          addr.address_line_2 = comp.long_name;
        if (types.includes("locality")) addr.city = comp.long_name;
        if (types.includes("administrative_area_level_1"))
          addr.state = comp.long_name;
        if (types.includes("postal_code")) addr.postal_code = comp.long_name;
        if (types.includes("country")) addr.country = comp.long_name;
      }

      const isValid = validatePostcode(addr.postal_code);
      setValid(isValid);
      setAddress(addr);

      if (isValid) setMessage(`✅ Delivery available in ${addr.postal_code}`);
      else
        setMessage(`❌ Outside delivery area (${addr.postal_code || "N/A"})`);
    } catch (err) {
      console.error("Reverse geocode failed", err);
      setMessage("Error fetching address");
      setValid(false);
    }
  }

  const handleMapClick = useCallback((e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      const loc = { lat: e.latLng.lat(), lng: e.latLng.lng() };
      setMarker(loc);
      fetchAddress(loc);
    }
  }, []);

  const handleMarkerDrag = useCallback((e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      const loc = { lat: e.latLng.lat(), lng: e.latLng.lng() };
      setMarker(loc);
      fetchAddress(loc);
    }
  }, []);

  if (!isLoaded) return <p>Loading map...</p>;
  if (!marker) return <p>Getting your location...</p>;

  return (
    <div className="bg-white rounded-2xl shadow-lg p-4">
      <h3 className="text-lg font-semibold mb-3">Select Delivery Location</h3>

      <div className="relative">
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={marker}
          zoom={15}
          onClick={handleMapClick}
        >
          <Marker position={marker} draggable onDragEnd={handleMarkerDrag} />
        </GoogleMap>
      </div>

      <div className="mt-4 text-center">
        <p className={`text-sm ${valid ? "text-green-600" : "text-red-600"}`}>
          {message}
        </p>

        {address && (
          <div className="mt-3 text-left bg-gray-50 border rounded-lg p-3">
            <p className="text-sm font-medium">{address.fullAddress}</p>
            <p className="text-xs text-gray-600">
              {address.city}, {address.state}, {address.postal_code}
            </p>
          </div>
        )}

        <button
          onClick={() => address && onConfirm(address)}
          disabled={!valid}
          className={`mt-4 w-full py-3 rounded-md font-medium transition-colors ${
            valid
              ? "bg-green-600 hover:bg-green-700 text-white"
              : "bg-gray-300 text-gray-600 cursor-not-allowed"
          }`}
        >
          {valid ? "Confirm Location" : "Select a Valid Delivery Area"}
        </button>
      </div>
    </div>
  );
}
