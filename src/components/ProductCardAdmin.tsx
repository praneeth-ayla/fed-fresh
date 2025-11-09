"use client";
import { ProductWithImagesAndAddons } from "@/types/db";
import ImagesCarousel from "./ImagesCarousel";
import {
  deleteProduct,
  duplicateProduct,
  toggleProductActive,
} from "@/actions/product";
import AddEditProductDialog from "./AddEditProductDialog";
import { Button } from "./ui/button";
import ConfirmDialog from "./ConfirmDialog";

export default function ProductCardAdmin({
  product,
}: {
  product: ProductWithImagesAndAddons;
}) {
  return (
    <div className="grid grid-cols-10 gap-5">
      <div className="col-span-2 aspect-square">
        <ImagesCarousel images={product.images.slice(0, 1)} />
      </div>

      <div className="col-span-7 flex flex-col justify-between">
        <div className="flex flex-col gap-5">
          <div className="font-bold text-xl pb-1">
            <p>{product.name}</p>
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              <p className="font-bold">Description:</p>
              <p className="line-clamp-2">{product.description}</p>
            </div>
            {product.addons.length > 0 && (
              <div className="flex gap-2">
                <p className="font-bold">Add ons:</p>
                <p>{product.addons.map((pa) => pa.name).join(", ")}</p>
              </div>
            )}
            <div className="flex gap-2">
              <p className="font-bold">Price:</p>
              <p>£{product.basePricePence / 100}</p>
            </div>
          </div>
        </div>

        <div className="flex gap-5">
          <AddEditProductDialog mode="edit" existing={product}>
            <Button className="bg-admin-btn hover:bg-admin-btn/50 hover:cursor-pointer px-5 py-2.5 rounded-lg font-bold">
              Modify
            </Button>
          </AddEditProductDialog>
          <ConfirmDialog
            title="Delete Item?"
            description="Are you sure you want to delete this item?"
            confirmText="Delete"
            onConfirm={() => deleteProduct(product.id)}
          >
            <Button className="bg-admin-btn hover:bg-admin-btn/50 hover:cursor-pointer px-5 py-2.5 rounded-lg font-bold">
              Delete
            </Button>
          </ConfirmDialog>

          <ConfirmDialog
            title={product.isActive ? "Pause Orders?" : "Resume Orders?"}
            description={
              product.isActive
                ? "Are you sure you want to stop accepting new orders? Customers will not be able to place orders until you turn this back on."
                : "Are you sure you want to start accepting new orders? Customers will be able to place orders immediately."
            }
            confirmText="Confirm"
            onConfirm={() => toggleProductActive(product.id, !product.isActive)}
          >
            <Button className="bg-admin-btn hover:bg-admin-btn/50 hover:cursor-pointer px-5 py-2.5 rounded-lg font-bold">
              {product.isActive ? "Disable" : "Enable"}
            </Button>
          </ConfirmDialog>
          <Button
            onClick={() => duplicateProduct(product.id)}
            className="bg-admin-btn hover:bg-admin-btn/50 hover:cursor-pointer px-5 py-2.5 rounded-lg font-bold"
          >
            Duplicate
          </Button>
        </div>
      </div>
    </div>
  );
}
