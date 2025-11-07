import { CartItem } from "@/context/CartContext";

export interface OrderSummaryProps {
  items: CartItem[];
  totalPrice: number;
  totalDeliveries: number;
}
// ------------------- Types -------------------
export interface Address {
  address_line_1: string;
  address_line_2?: string;
  city: string;
  state?: string;
  postal_code: string;
  country: string;
  lat?: number;
  lng?: number;
  fullAddress?: string;
}

export interface CustomerInfoProps {
  email: string;
  phone: string;
  setEmail: (v: string) => void;
  setPhone: (v: string) => void;
}

export interface DeliveryAddressSectionProps {
  address: Address;
  setAddress: (v: Address) => void;
  postcodeError: string;
}

// /types/geocode.ts
export type AddressComponent = {
  long_name: string;
  short_name: string;
  types: string[];
};

export type GeocodeResult = {
  formatted_address: string;
  address_components: AddressComponent[];
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
};

export type GeocodeResponse = {
  results: GeocodeResult[];
  status: string;
};
