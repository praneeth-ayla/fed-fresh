/*
  Warnings:

  - You are about to drop the column `usageLimit` on the `Discount` table. All the data in the column will be lost.
  - You are about to drop the column `usedCount` on the `Discount` table. All the data in the column will be lost.
  - You are about to drop the column `validFrom` on the `Discount` table. All the data in the column will be lost.
  - You are about to drop the column `validUntil` on the `Discount` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Discount" DROP COLUMN "usageLimit",
DROP COLUMN "usedCount",
DROP COLUMN "validFrom",
DROP COLUMN "validUntil",
ADD COLUMN     "categoryIds" INTEGER[],
ADD COLUMN     "description" TEXT,
ADD COLUMN     "maxDiscountCapPence" INTEGER;
