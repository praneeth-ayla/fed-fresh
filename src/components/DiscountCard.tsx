"use client";
import AddEditDiscountDialog from "@/components/AddEditDiscountDialog";
import { disableDiscount } from "@/actions/pricing";
import { Discount, Category } from "@prisma/client";

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
    <div key={discount.id} className="bg-gray-100 p-5 rounded-md border">
      <p className="font-semibold">Code: {discount.code}</p>
      <p>Type: {discount.type}</p>
      <p>
        Value:{" "}
        {discount.type === "FIXED"
          ? `£${(discount.valuePence / 100).toFixed(2)}`
          : `${discount.valuePence}%`}
      </p>
      <p>
        Min Cart: £{(discount.minOrderAmountPence / 100).toFixed(2) || "0.00"}
      </p>
      <p>Status: {discount.isActive ? "Active" : "Disabled"}</p>

      <p>
        Categories:{" "}
        {selectedCategories.length > 0
          ? selectedCategories.map((c) => c.name).join(", ")
          : "None"}
      </p>

      <div className="mt-3 flex gap-2">
        <AddEditDiscountDialog
          mode="edit"
          existing={discount}
          categories={categories}
        />
        <button
          onClick={() => disableDiscount(discount.id)}
          className="text-sm hover:cursor-pointer"
        >
          {discount.isActive ? "Disable" : "Enable"}
        </button>
      </div>
    </div>
  );
}
