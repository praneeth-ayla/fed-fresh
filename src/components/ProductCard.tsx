import { ProductWithImagesAndAddons } from "@/types/db";
import ImagesCarousel from "./ImagesCarousel";

export default function ProductCard({
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
            <div className="flex gap-2">
              <p className="font-bold">Add ons:</p>
              <p>{product.addons.map((pa) => pa.addon.name).join(", ")}</p>
            </div>
            <div className="flex gap-2">
              <p className="font-bold">Price:</p>
              <p>{product.basePrice.toString()}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="bg-gray-500 px-2 py-1 text-white rounded-md">
              Modify
            </button>
            <button className="bg-gray-500 px-2 py-1 text-white rounded-md">
              Delete
            </button>
            <button className="bg-gray-500 px-2 py-1 text-white rounded-md">
              Disable
            </button>
            <button className="bg-gray-500 px-2 py-1 text-white rounded-md">
              Duplicate
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
