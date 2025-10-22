"use client";

import { useState, useTransition } from "react";
import { addProduct, updateProduct } from "@/actions/product";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ProductWithImagesAndAddons } from "@/types/db";
import { X } from "lucide-react";
import { UploadButton } from "@/lib/uploadthing";
import Image from "next/image";

type AddEditProductDialogProps = {
  mode?: "add" | "edit";
  existing?: ProductWithImagesAndAddons;
  categoryId?: number;
  children: React.ReactNode;
};

export default function AddEditProductDialog({
  mode = "add",
  existing,
  categoryId,
  children,
}: AddEditProductDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  // Local form states
  const [name, setName] = useState(existing?.name || "");
  const [basePricePence, setBasePricePence] = useState(
    existing?.basePricePence?.toString() || "0"
  );
  const [description, setDescription] = useState(existing?.description || "");
  const [tags, setTags] = useState(existing?.tags || "");
  const [availabilityOneTime, setAvailabilityOneTime] = useState(
    existing?.availabilityOneTime ?? false
  );
  const [availabilityWeekly, setAvailabilityWeekly] = useState(
    existing?.availabilityWeekly ?? false
  );
  const [allergenNotes, setAllergenNotes] = useState(
    existing?.allergenNotes || ""
  );
  const [maxFreeAddons, setMaxFreeAddons] = useState(
    existing?.maxFreeAddons?.toString() || "0"
  );
  const [maxPaidAddons, setMaxPaidAddons] = useState(
    existing?.maxPaidAddons?.toString() || "0"
  );
  const [addonName, setAddonName] = useState("");
  const [addonPrice, setAddonPrice] = useState("");
  const [addons, setAddons] = useState<{ name: string; pricePence: number }[]>(
    existing?.addons || []
  );
  const [images, setImages] = useState<string[]>(
    existing?.images?.map((img) => img.url) || []
  );

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    formData.append("categoryId", String(categoryId || existing?.categoryId));
    formData.append("addons", JSON.stringify(addons));

    formData.append("images", JSON.stringify(images));

    // Append image files to formData
    images.forEach((url, index) => {
      formData.append(`image_${index}`, url);
    });

    startTransition(async () => {
      if (mode === "add") {
        await addProduct(formData);
      } else {
        await updateProduct(formData);
      }
      router.refresh();
      setIsOpen(false);
    });
  }

  function handleAddAddon() {
    const name = addonName.trim();
    const price = Number(addonPrice);

    if (!name) return;
    setAddons((prev) => [...prev, { name, pricePence: price }]);
    setAddonName("");
    setAddonPrice("");
  }

  function handleRemoveAddon(index: number) {
    setAddons((prev) => prev.filter((_, i) => i !== index));
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <div onClick={() => setIsOpen(true)}>{children}</div>

      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>
              {mode === "add" ? "Add new Item" : "Edit Item"}
            </DialogTitle>
            <DialogDescription>
              {mode === "add"
                ? "Create a new product in the menu."
                : "Update the product details below."}
            </DialogDescription>
          </DialogHeader>

          {mode === "edit" && (
            <input type="hidden" name="id" value={existing?.id} />
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Item name</Label>
              <Input
                id="name"
                name="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="basePricePence">Item price (in pence)</Label>
              <Input
                id="basePricePence"
                name="basePricePence"
                type="number"
                min={0}
                value={basePricePence}
                onChange={(e) => setBasePricePence(e.target.value)}
                placeholder="In pence (e.g., 1299 for £12.99)"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="description">Item description</Label>
              <Textarea
                id="description"
                name="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional"
                rows={3}
                className="resize-none"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="tags">Tags (comma separated)</Label>
              <Input
                id="tags"
                name="tags"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="Optional"
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Item images</Label>
            <div className="flex items-center gap-2">
              <UploadButton
                endpoint="imageUploader"
                onClientUploadComplete={(res) => {
                  if (!res) return;
                  const urls = res.map((file) => file.url);
                  setImages((prev) => [...prev, ...urls]);
                }}
                onUploadError={(error: Error) => {
                  alert(`Upload failed: ${error.message}`);
                }}
                className="upload-btn-wrapper"
                appearance={{
                  button:
                    "bg-white text-black border border-gray-300 px-3 py-1 rounded text-sm hover:bg-gray-100 transition",
                  container: "w-auto",
                  allowedContent: "hidden", // hides default "Allowed files" text
                }}
              />

              {images.length > 0 && (
                <span className="text-sm text-muted-foreground">
                  {images.length} image(s) uploaded
                </span>
              )}
            </div>

            <div className="flex flex-wrap gap-4 mt-2">
              {images.map((url, index) => (
                <div
                  key={index}
                  className="relative w-20 h-20 rounded overflow-hidden border group"
                >
                  <Image
                    src={url}
                    alt={`Uploaded image ${index + 1}`}
                    fill
                    unoptimized
                    className="object-cover"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setImages((prev) => prev.filter((_, i) => i !== index))
                    }
                    className="absolute top-0 right-0 p-1 bg-black bg-opacity-70 text-white text-xs rounded-bl hover:bg-opacity-90 transition"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Availability</Label>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <input
                  id="availabilityOneTime"
                  name="availabilityOneTime"
                  type="checkbox"
                  checked={availabilityOneTime}
                  onChange={(e) => setAvailabilityOneTime(e.target.checked)}
                  className="h-4 w-4"
                />
                <Label htmlFor="availabilityOneTime" className="font-normal">
                  One time
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  id="availabilityWeekly"
                  name="availabilityWeekly"
                  type="checkbox"
                  checked={availabilityWeekly}
                  onChange={(e) => setAvailabilityWeekly(e.target.checked)}
                  className="h-4 w-4"
                />
                <Label htmlFor="availabilityWeekly" className="font-normal">
                  Weekly
                </Label>
              </div>
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="allergenNotes">Allergen Notes</Label>
            <Input
              id="allergenNotes"
              name="allergenNotes"
              value={allergenNotes}
              onChange={(e) => setAllergenNotes(e.target.value)}
              placeholder="Optional"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="maxFreeAddons">Max Free Addons</Label>
              <Input
                id="maxFreeAddons"
                name="maxFreeAddons"
                type="number"
                min={0}
                value={maxFreeAddons}
                onChange={(e) => setMaxFreeAddons(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="maxPaidAddons">Max Paid Addons</Label>
              <Input
                id="maxPaidAddons"
                name="maxPaidAddons"
                type="number"
                min={0}
                value={maxPaidAddons}
                onChange={(e) => setMaxPaidAddons(e.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-3">
            <Label>Add-ons</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Addon name"
                value={addonName}
                onChange={(e) => setAddonName(e.target.value)}
              />
              <Input
                placeholder="Addon price (in pence)"
                type="number"
                value={addonPrice}
                onChange={(e) => setAddonPrice(e.target.value)}
                min="0"
              />
              <Button type="button" onClick={handleAddAddon}>
                Add
              </Button>
            </div>

            <div className="flex flex-wrap gap-2 mt-2">
              {addons.map((addon, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-full text-sm"
                >
                  <span>
                    {addon.name} (£{addon.pricePence / 100})
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveAddon(idx)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter className="pt-4 flex-col sm:flex-row gap-2">
            <div className="flex gap-2 justify-end">
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </DialogClose>

              <Button type="submit" disabled={isPending}>
                {isPending
                  ? mode === "add"
                    ? "Adding..."
                    : "Saving..."
                  : mode === "add"
                  ? "Add"
                  : "Save"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
