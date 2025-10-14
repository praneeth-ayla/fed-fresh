/*
  Warnings:

  - You are about to drop the column `price` on the `Addon` table. All the data in the column will be lost.
  - You are about to drop the column `minOrderAmount` on the `Discount` table. All the data in the column will be lost.
  - You are about to drop the column `value` on the `Discount` table. All the data in the column will be lost.
  - You are about to drop the column `discountAmount` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `subtotal` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `totalAmount` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `totalPrice` on the `OrderItem` table. All the data in the column will be lost.
  - You are about to drop the column `unitPrice` on the `OrderItem` table. All the data in the column will be lost.
  - You are about to drop the column `basePrice` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the `VerificationRequest` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `valuePence` to the `Discount` table without a default value. This is not possible if the table is not empty.
  - Added the required column `subtotalPence` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `totalAmountPence` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `totalPricePence` to the `OrderItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `unitPricePence` to the `OrderItem` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Addon" DROP COLUMN "price",
ADD COLUMN     "pricePence" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Discount" DROP COLUMN "minOrderAmount",
DROP COLUMN "value",
ADD COLUMN     "minOrderAmountPence" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "valuePence" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Image" ALTER COLUMN "metadata" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Order" DROP COLUMN "discountAmount",
DROP COLUMN "subtotal",
DROP COLUMN "totalAmount",
ADD COLUMN     "discountAmountPence" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "subtotalPence" INTEGER NOT NULL,
ADD COLUMN     "totalAmountPence" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "OrderItem" DROP COLUMN "totalPrice",
DROP COLUMN "unitPrice",
ADD COLUMN     "totalPricePence" INTEGER NOT NULL,
ADD COLUMN     "unitPricePence" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Product" DROP COLUMN "basePrice",
ADD COLUMN     "basePricePence" INTEGER NOT NULL DEFAULT 0;

-- DropTable
DROP TABLE "public"."VerificationRequest";
