import { Prisma } from "@prisma/client";

/**
 * --------------------------------------------------------------------------
 * 🛍️ PRODUCT-RELATED TYPES
 * --------------------------------------------------------------------------
 */

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
  include: { images: true; addons: { include: { addon: true } } };
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
        addons: { include: { addon: true } };
      };
    };
  };
}>;

/**
 * --------------------------------------------------------------------------
 * 🧾 ORDER-RELATED TYPES
 * --------------------------------------------------------------------------
 */

/**
 * Order including items and deliveries.
 */
export type OrderWithItems = Prisma.OrderGetPayload<{
  include: {
    items: true;
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
          include: { images: true };
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
 * --------------------------------------------------------------------------
 * 🎁 ADDON TYPES
 * --------------------------------------------------------------------------
 */

/**
 * Addon with all products that use it.
 */
export type AddonWithProducts = Prisma.AddonGetPayload<{
  include: { products: { include: { product: true } } };
}>;

/**
 * --------------------------------------------------------------------------
 * 📦 UTILITY TYPES
 * --------------------------------------------------------------------------
 */

/**
 * A lightweight product type for listings (id, name, price, image).
 */
export type ProductListItem = Pick<
  Prisma.ProductGetPayload<{ include: { images: true } }>,
  "id" | "name" | "basePrice" | "images"
>;

/**
 * A reusable product detail type (used for admin and menu).
 */
export type ProductDetail = ProductWithImagesAndAddons;

/**
 * --------------------------------------------------------------------------
 * 🧠 NOTES:
 * - Keep naming descriptive but not overly verbose.
 * - You can combine includes to match query patterns in your app.
 * - Prefer PascalCase (`ProductWithImages`) for types.
 * --------------------------------------------------------------------------
 */
