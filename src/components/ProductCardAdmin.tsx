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
      <div className="grid grid-cols-10 gap-5">
        <div className="col-span-2 aspect-square">
          <ImagesCarousel images={product.images.slice(0, 1)} />
        </div>
        <div className="col-span-7 flex-col flex  justify-between">
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
              <button className="bg-[#CBCBCB] px-5 py-2.5 rounded-lg font-bold">
                Modify
              </button>
            </AddEditProductDialog>
            <button
              onClick={() => deleteProduct(product.id)}
              className="bg-[#CBCBCB] px-5 py-2.5 rounded-lg font-bold"
            >
              Delete
            </button>
            <button
              onClick={() => toggleProductActive(product.id, !product.isActive)}
              className="bg-[#CBCBCB] px-5 py-2.5 rounded-lg font-bold"
            >
              {product.isActive ? "Disable" : "Enable"}
            </button>
            <button
              onClick={() => duplicateProduct(product.id)}
              className="bg-[#CBCBCB] px-5 py-2.5 rounded-lg font-bold"
            >
              Duplicate
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
