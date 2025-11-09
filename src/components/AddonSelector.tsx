import { ProductWithImagesAndAddons } from "@/types/db";
import { Addon } from "@prisma/client";
import { useState, useEffect } from "react";

interface AddonsSelectorProps {
  product: ProductWithImagesAndAddons;
  freeAddons: Addon[];
  paidAddons: Addon[];
  onChange: (selectedFree: number[], selectedPaid: number[]) => void;
}

export default function AddonsSelector({
  product,
  freeAddons,
  paidAddons,
  onChange,
}: AddonsSelectorProps) {
  const [selectedFreeAddons, setSelectedFreeAddons] = useState<number[]>([]);
  const [selectedPaidAddons, setSelectedPaidAddons] = useState<number[]>([]);

  const toggleAddon = (
    id: number,
    selected: number[],
    setSelected: React.Dispatch<React.SetStateAction<number[]>>,
    max: number
  ) => {
    // If max == 0, allow unlimited selection
    if (max == 0) {
      if (selected.includes(id)) {
        setSelected(selected.filter((a) => a !== id));
      } else {
        setSelected([...selected, id]);
      }
      return;
    }

    if (selected.includes(id)) {
      setSelected(selected.filter((a) => a !== id));
    } else if (selected.length < max) {
      setSelected([...selected, id]);
    }
  };

  const handleAddonToggle = (id: number, type: "free" | "paid") => {
    if (type === "free") {
      toggleAddon(
        id,
        selectedFreeAddons,
        setSelectedFreeAddons,
        product.maxFreeAddons
      );
    } else {
      toggleAddon(
        id,
        selectedPaidAddons,
        setSelectedPaidAddons,
        product.maxPaidAddons
      );
    }
  };

  useEffect(() => {
    onChange(selectedFreeAddons, selectedPaidAddons);
  }, [selectedFreeAddons, selectedPaidAddons]);

  const isAtFreeLimit =
    product.maxFreeAddons !== 0 &&
    selectedFreeAddons.length >= product.maxFreeAddons;
  const isAtPaidLimit =
    product.maxPaidAddons !== 0 &&
    selectedPaidAddons.length >= product.maxPaidAddons;

  return (
    <div className="max-w-2xl flex flex-col xl:flex-row justify-between gap-10">
      {/* Free Addons */}
      {freeAddons.length > 0 && (
        <div>
          <h3 className="font-bold text-base mb-2">
            Free Add-ons{" "}
            {product.maxFreeAddons != 0 && (
              <span className="font-normal text-gray-500">
                (Choose up to {product.maxFreeAddons})
              </span>
            )}
          </h3>
          <div className="space-y-2">
            {freeAddons.map((addon) => {
              const isSelected = selectedFreeAddons.includes(addon.id);
              const isDisabled = !isSelected && isAtFreeLimit;

              return (
                <label
                  key={addon.id}
                  className={`flex gap-2 items-center w-fit ${
                    isDisabled
                      ? "opacity-50 cursor-not-allowed"
                      : "cursor-pointer"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => handleAddonToggle(addon.id, "free")}
                    disabled={isDisabled}
                    className="w-5 h-5 border-2  rounded-sm border-gray-300 accent-primary appearance-none checked:bg-primary checked:border-primary cursor-pointer relative checked:after:content-['✓'] checked:after:absolute checked:after:text-white checked:after:text-lg checked:after:font-bold checked:after:left-1/2 checked:after:top-1/2 checked:after:-translate-x-1/2 checked:after:-translate-y-1/2 disabled:cursor-not-allowed"
                  />
                  <span className={isSelected ? "font-semibold" : ""}>
                    {addon.name}
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      )}
      {/* Paid Addons */}
      {paidAddons.length > 0 && (
        <div>
          <h3 className="font-bold text-base mb-2">
            Extra Add-ons{" "}
            {product.maxPaidAddons != 0 && (
              <span className="font-normal text-gray-500">
                (Choose up to {product.maxPaidAddons})
              </span>
            )}
          </h3>
          <div className="flex flex-col gap-2">
            {paidAddons.map((addon) => {
              const isSelected = selectedPaidAddons.includes(addon.id);
              const isDisabled = !isSelected && isAtPaidLimit;

              return (
                <label
                  key={addon.id}
                  className={`flex gap-2 items-center ${
                    isDisabled
                      ? "opacity-50 cursor-not-allowed"
                      : "cursor-pointer"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => handleAddonToggle(addon.id, "paid")}
                    disabled={isDisabled}
                    className="w-5 h-5 border-2 rounded-sm border-gray-300 accent-primary appearance-none checked:bg-primary checked:border-primary cursor-pointer relative checked:after:content-['✓'] checked:after:absolute checked:after:text-white checked:after:text-lg checked:after:font-bold checked:after:left-1/2 checked:after:top-1/2 checked:after:-translate-x-1/2 checked:after:-translate-y-1/2 disabled:cursor-not-allowed"
                  />
                  <div
                    className={`flex justify-between gap-5 w-full ${
                      !isDisabled && isSelected && "font-bold"
                    }`}
                  >
                    <div>{addon.name}</div>
                    <div>£{addon.pricePence / 100}</div>
                  </div>
                </label>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
