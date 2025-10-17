"use client";

import { useState, useTransition } from "react";
import {
  addCategory,
  updateCategory,
  deleteCategory,
} from "@/app/actions/category";
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
import { Category } from "@prisma/client";

type AddEditCategoryDialogProps = {
  mode?: "add" | "edit";
  existing?: Category;
  triggerLabel?: string;
};

export default function AddEditCategoryDialog({
  mode = "add",
  existing,
  triggerLabel,
}: AddEditCategoryDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState(existing?.name || "");
  const [sortOrder, setSortOrder] = useState(
    existing?.sortOrder?.toString() || "0"
  );
  const [description, setDescription] = useState(existing?.description || "");
  const router = useRouter();

  async function handleSubmit(formData: FormData) {
    startTransition(async () => {
      if (mode === "add") {
        await addCategory(formData);
        router.refresh();
      } else {
        const updated = await updateCategory(formData);
        router.push(`/admin/menu/${updated.slug}`);
      }

      setIsOpen(false);
    });
  }

  async function handleDelete() {
    if (existing && confirm(`Delete "${existing.name}"?`)) {
      startTransition(async () => {
        await deleteCategory(existing.id);
        router.push(`/admin/menu`); // go back to menu
        setIsOpen(false);
      });
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant={mode === "add" ? "outline" : "secondary"}
          className={mode === "add" ? "bg-gray-200" : "bg-none border-0"}
        >
          {triggerLabel || (mode === "add" ? "Add" : "Edit")}
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[425px]">
        <form action={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>
              {mode === "add" ? "Add Category" : "Edit Category"}
            </DialogTitle>
            <DialogDescription>
              {mode === "add"
                ? "Create a new category to organize your products."
                : "Update the selected category details below."}
            </DialogDescription>
          </DialogHeader>

          {mode === "edit" && (
            <input type="hidden" name="id" value={existing?.id} />
          )}

          <div className="grid gap-3">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              name="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="grid gap-3">
            <Label htmlFor="sortOrder">Sort Order</Label>
            <Input
              id="sortOrder"
              name="sortOrder"
              min={1}
              value={sortOrder}
              type="number"
              onChange={(e) => setSortOrder(e.target.value)}
              required
            />
          </div>

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

          <DialogFooter className="pt-4 flex justify-between">
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>

            <div className="flex gap-2">
              {mode === "edit" && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={isPending}
                >
                  {isPending ? "Deleting..." : "Delete"}
                </Button>
              )}
              <Button type="submit" disabled={isPending}>
                {isPending
                  ? mode === "add"
                    ? "Adding..."
                    : "Updating..."
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
