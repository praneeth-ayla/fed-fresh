"use client";
import AddEditDiscountDialog from "@/components/AddEditDiscountDialog";
import { disableDiscount } from "@/actions/pricing";
import { Discount, Category } from "@prisma/client";
import { Button } from "./ui/button";

export default function DiscountCard({
  discount,
  categories,
}: {
  discount: Discount;
  categories: Category[];
}) {
  const selectedCategories = categories.filter((c) =>
    discount.categoryIds.includes(c.id)
  );

  return (
    <div
      key={discount.id}
      className="bg-gray-100 p-5 rounded-md flex flex-col gap-4 min-w-sm"
    >
      <p>
        <strong>Discount code:</strong> {discount.code}
      </p>
      <div>
        <p>
          <strong>Type:</strong>{" "}
          {discount.type === "FIXED" ? "Fixed amount" : "Percentage"}
        </p>
        <p>
          <strong>Discount value:</strong>{" "}
          {discount.type === "FIXED"
            ? `£${(discount.valuePence / 100).toFixed(2)}`
            : `${discount.valuePence}%`}
        </p>
        <p>
          <strong>Applicable categories:</strong>{" "}
          {selectedCategories.length > 0
            ? selectedCategories.map((c) => c.name).join(", ")
            : "None"}
        </p>
        <p>
          <strong>Minimum cart value:</strong> £
          {(discount.minOrderAmountPence / 100).toFixed(2) || "0.00"}
        </p>
        <p>
          <strong>Status:</strong> {discount.isActive ? "Active" : "Disabled"}
        </p>
      </div>
      <div className="mt-3 flex gap-2">
        <AddEditDiscountDialog
          mode="edit"
          existing={discount}
          categories={categories}
        />
        <Button
          onClick={() => disableDiscount(discount.id)}
          className="text-sm hover:cursor-pointer"
        >
          {discount.isActive ? "Disable" : "Enable"}
        </Button>
      </div>
    </div>
  );
}
