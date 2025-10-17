import { Prisma } from "@prisma/client";

/**
 * Product with images included.
 */
export type ProductWithImages = Prisma.ProductGetPayload<{
  include: { images: true };
}>;

/**
 * Product with images and addons included.
 */
export type ProductWithImagesAndAddons = Prisma.ProductGetPayload<{
  include: { images: true; addons: true };
}>;

/**
 * Category with all related products (and their images).
 */
export type CategoryWithProducts = Prisma.CategoryGetPayload<{
  include: {
    products: {
      include: { images: true };
    };
  };
}>;

/**
 * Category with products including images + addons.
 */
export type CategoryWithProductsAndAddons = Prisma.CategoryGetPayload<{
  include: {
    products: {
      include: {
        images: true;
        addons: true;
      };
    };
  };
}>;

/**
 * Order including items and deliveries.
 */
export type OrderWithItems = Prisma.OrderGetPayload<{
  include: {
    items: true;
    deliveries: true;
  };
}>;

/**
 * Order with items (and each item includes product and addons).
 */
export type OrderWithItemsAndAddons = Prisma.OrderGetPayload<{
  include: {
    items: {
      include: {
        product: {
          include: { images: true; addons: true };
        };
        addons: {
          include: { addon: true };
        };
      };
    };
    deliveries: true;
  };
}>;

/**
 * Addon with all products that use it.
 */
export type AddonWithProducts = Prisma.AddonGetPayload<{
  include: { Product: true };
}>;

/**
 * A lightweight product type for listings (id, name, basePricePence, images).
 */
export type ProductListItem = Pick<
  Prisma.ProductGetPayload<{ include: { images: true } }>,
  "id" | "name" | "basePricePence" | "images"
>;

/**
 * A reusable product detail type (used for admin and menu).
 */
export type ProductDetail = ProductWithImagesAndAddons;
