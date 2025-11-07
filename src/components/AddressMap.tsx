"use client";

import { useState, useCallback } from "react";
import { GoogleMap, useLoadScript, Marker } from "@react-google-maps/api";

const mapContainerStyle = {
  width: "100%",
  height: "300px",
};

const center = {
  lat: 52.6369, // Leicester coordinates
  lng: -1.1398,
};

const leicesterBounds = {
  north: 52.7,
  south: 52.58,
  east: -1.0,
  west: -1.2,
};

interface AddressMapProps {
  onLocationSelect: (location: {
    lat: number;
    lng: number;
    address: string;
  }) => void;
  selectedLocation?: { lat: number; lng: number; address: string };
}

export default function AddressMap({
  onLocationSelect,
  selectedLocation,
}: AddressMapProps) {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
  });

  const [map, setMap] = useState<google.maps.Map | null>(null);

  const onMapClick = useCallback(
    (e: google.maps.MapMouseEvent) => {
      if (!e.latLng) return;

      const lat = e.latLng.lat();
      const lng = e.latLng.lng();

      // Reverse geocode to get address
      const geocoder = new google.maps.Geocoder();
      geocoder.geocode({ location: { lat, lng } }, (results, status) => {
        if (status === "OK" && results?.[0]) {
          const address = results[0].formatted_address;
          onLocationSelect({ lat, lng, address });
        }
      });
    },
    [onLocationSelect]
  );

  const onMapLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
    // Set bounds to Leicester area
    const bounds = new google.maps.LatLngBounds(
      new google.maps.LatLng(leicesterBounds.south, leicesterBounds.west),
      new google.maps.LatLng(leicesterBounds.north, leicesterBounds.east)
    );
    map.fitBounds(bounds);
  }, []);

  if (loadError) return <div>Error loading maps</div>;
  if (!isLoaded) return <div>Loading maps...</div>;

  return (
    <GoogleMap
      mapContainerStyle={mapContainerStyle}
      zoom={12}
      center={center}
      onClick={onMapClick}
      onLoad={onMapLoad}
      options={{
        restriction: {
          latLngBounds: leicesterBounds,
          strictBounds: false,
        },
      }}
    >
      {selectedLocation && (
        <Marker
          position={{ lat: selectedLocation.lat, lng: selectedLocation.lng }}
        />
      )}
    </GoogleMap>
  );
}
