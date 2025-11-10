"use client";

import { useState, useTransition } from "react";
import { addDiscount, updateDiscount, deleteDiscount } from "@/actions/pricing";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Discount, Category } from "@prisma/client";
import ConfirmDialog from "./ConfirmDialog";

type Props = {
  mode?: "add" | "edit";
  existing?: Discount;
  triggerLabel?: string;
  categories: Category[];
};

export default function AddEditDiscountDialog({
  mode = "add",
  existing,
  triggerLabel,
  categories,
}: Props) {
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  const [code, setCode] = useState(existing?.code || "");
  const [type, setType] = useState<"FIXED" | "PERCENTAGE">(
    existing?.type || "FIXED"
  );
  const [value, setValue] = useState(
    existing ? String(existing.valuePence) : ""
  );
  const [minOrder, setMinOrder] = useState(
    existing ? String(existing.minOrderAmountPence) : "0"
  );
  const [maxCap, setMaxCap] = useState(
    existing?.maxDiscountCapPence ? String(existing.maxDiscountCapPence) : ""
  );
  const [description, setDescription] = useState(existing?.description || "");
  const [selectedCategories, setSelectedCategories] = useState<number[]>(
    existing?.categoryIds || []
  );

  function toggleCategory(id: number) {
    setSelectedCategories((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    console.log({ selectedCategories });
    if (selectedCategories.length == 0) {
      return;
    }
    const formData = new FormData(e.currentTarget);
    selectedCategories.forEach((id) =>
      formData.append("categories", String(id))
    );

    startTransition(async () => {
      if (mode === "add") {
        await addDiscount(formData);
      } else {
        await updateDiscount(formData);
      }
      setIsOpen(false);
      router.refresh();
    });
  }

  async function handleDelete() {
    if (existing) {
      startTransition(async () => {
        await deleteDiscount(existing.id);
        router.refresh();
        setIsOpen(false);
      });
    }
  }

  const isSaveDisabled =
    isPending || selectedCategories.length === 0 || !code.trim() || !value;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          {triggerLabel || (mode === "add" ? "Add Discount" : "Edit")}
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[560px]">
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>
              {mode === "add" ? "Add Discount" : "Edit Discount"}
            </DialogTitle>
            <DialogDescription>
              {mode === "add"
                ? "Create a new discount code."
                : "Update the discount details below."}
            </DialogDescription>
          </DialogHeader>

          {mode === "edit" && (
            <input type="hidden" name="id" value={existing?.id} />
          )}

          {/* Code */}
          <div className="grid gap-3">
            <Label htmlFor="code">Discount code</Label>
            <Input
              id="code"
              name="code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
            />
          </div>

          {/* Type */}
          <div className="grid gap-3">
            <Label htmlFor="type">Type</Label>
            <select
              id="type"
              name="type"
              value={type}
              onChange={(e) =>
                setType(e.target.value as "FIXED" | "PERCENTAGE")
              }
              className="border rounded-md p-2"
            >
              <option value="FIXED">Fixed amount (pence)</option>
              <option value="PERCENTAGE">Percentage</option>
            </select>
          </div>

          {/* Two-column layout */}
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="value">
                {type === "FIXED" ? "Discount value (in pence)" : "Discount %"}
              </Label>
              <Input
                id="value"
                name="value"
                type="number"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={type === "FIXED" ? "e.g. 500 for £5" : "e.g. 10"}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="minOrder">Minimum order value (in pence)</Label>
              <Input
                id="minOrder"
                name="minOrder"
                type="number"
                value={minOrder}
                onChange={(e) => setMinOrder(e.target.value)}
                placeholder="Optional"
              />
            </div>
          </div>

          {/* Max cap for percentage */}
          {type === "PERCENTAGE" && (
            <div className="grid gap-2">
              <Label htmlFor="maxCap">Maximum cap (in pence)</Label>
              <Input
                id="maxCap"
                name="maxCap"
                type="number"
                value={maxCap}
                onChange={(e) => setMaxCap(e.target.value)}
                placeholder="Optional"
              />
            </div>
          )}

          {/* Description */}
          <div className="grid gap-3">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              name="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional"
            />
          </div>

          {/* Category selection */}
          <div className="grid gap-2">
            <Label>Applicable Categories</Label>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <label
                  key={cat.id}
                  className={`px-3 py-1 border rounded-md cursor-pointer text-sm ${
                    selectedCategories.includes(cat.id)
                      ? "bg-blue-100 border-blue-500"
                      : "bg-gray-50 border-gray-300"
                  }`}
                >
                  <input
                    type="checkbox"
                    value={cat.id}
                    checked={selectedCategories.includes(cat.id)}
                    onChange={() => toggleCategory(cat.id)}
                    className="hidden"
                  />
                  {cat.name}
                </label>
              ))}
            </div>
            {selectedCategories.length === 0 && (
              <p className="text-sm text-red-500">
                Please select at least one category
              </p>
            )}
          </div>

          <DialogFooter className="pt-4 flex justify-between">
            <DialogClose asChild>
              <Button type="button">Cancel</Button>
            </DialogClose>

            <div className="flex gap-2">
              {mode === "edit" && (
                <ConfirmDialog
                  title="Delete Discount?"
                  description="Are you sure you want to delete this Discount code?"
                  confirmText="Delete"
                  onConfirm={handleDelete}
                >
                  <Button type="button" disabled={isPending}>
                    {isPending ? "Deleting..." : "Delete"}
                  </Button>
                </ConfirmDialog>
              )}
              <Button type="submit" disabled={isSaveDisabled}>
                {isPending
                  ? mode === "add"
                    ? "Adding..."
                    : "Updating..."
                  : mode === "add"
                  ? "Save"
                  : "Update"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
