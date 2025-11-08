"use client";
import { ProductWithImagesAndAddons } from "@/types/db";
import ImagesCarousel from "./ImagesCarousel";
import {
  deleteProduct,
  duplicateProduct,
  toggleProductActive,
} from "@/actions/product";
import AddEditProductDialog from "./AddEditProductDialog";

export default function ProductCardAdmin({
  product,
}: {
  product: ProductWithImagesAndAddons;
}) {
  return (
    <>
      <div className="grid grid-cols-10 gap-4">
        <div className="col-span-3">
          <ImagesCarousel images={product.images} />
        </div>
        <div className="col-span-7 flex-col flex  justify-between">
          <div>
            <div className="font-bold text-lg pb-1">
              <p>{product.name}</p>
            </div>
            <div className="flex gap-2">
              <p className="font-bold">Description:</p>
              <p>{product.description}</p>
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
          <div className="flex gap-2">
            <AddEditProductDialog mode="edit" existing={product}>
              <button className="bg-gray-500 px-2 py-1 text-white rounded-md">
                Modify
              </button>
            </AddEditProductDialog>
            <button
              onClick={() => deleteProduct(product.id)}
              className="bg-gray-500 px-2 py-1 text-white rounded-md"
            >
              Delete
            </button>
            <button
              onClick={() => toggleProductActive(product.id, !product.isActive)}
              className="bg-gray-500 px-2 py-1 text-white rounded-md"
            >
              {product.isActive ? "Disable" : "Enable"}
            </button>
            <button
              onClick={() => duplicateProduct(product.id)}
              className="bg-gray-500 px-2 py-1 text-white rounded-md"
            >
              Duplicate
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
