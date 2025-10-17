/*
  Warnings:

  - You are about to drop the column `isActive` on the `Addon` table. All the data in the column will be lost.
  - You are about to drop the `ProductAddon` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."ProductAddon" DROP CONSTRAINT "ProductAddon_addonId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ProductAddon" DROP CONSTRAINT "ProductAddon_productId_fkey";

-- AlterTable
ALTER TABLE "Addon" DROP COLUMN "isActive",
ADD COLUMN     "productId" INTEGER;

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "tags" TEXT;

-- DropTable
DROP TABLE "public"."ProductAddon";

-- AddForeignKey
ALTER TABLE "Addon" ADD CONSTRAINT "Addon_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;
