import { ProductWithImages } from "@/types/db";
import Link from "next/link";
import React from "react";
import { Badge } from "./ui/badge";
import ImagesCarousel from "./ImagesCarousel";

export default function ProductCard({
  product,
  categorySlug,
}: {
  product: ProductWithImages;
  categorySlug: string;
}) {
  return (
    <Link key={product.id} href={`/${categorySlug}/${product.slug}`}>
      {/* Display images carousel if product has images */}
      <div className="min-h-80 aspect-square">
        <ImagesCarousel images={product.images.slice(0, 1)} />
      </div>

      {/* Product details */}
      <div className="pt-4 flex flex-col gap-1.5">
        {product.tags && (
          <div className="flex gap-2">
            {product.tags?.split(",").map((tag, id) => (
              <Badge
                className="bg-primary/25 border-primary text-sm font-normal px-3.5 py-1 capitalize"
                key={id}
              >
                {tag}
              </Badge>
            ))}
          </div>
        )}
        <h2 className="font-semibold text-lg">{product.name}</h2>
        <p className="text-lg">£{(product.basePricePence / 100).toFixed(2)}</p>
        <p className="text-sm text-gray-600 line-clamp-2">
          {product.description}
        </p>
      </div>
    </Link>
  );
}
