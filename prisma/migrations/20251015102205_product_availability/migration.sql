-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "availabilityOneTime" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "availabilityWeekly" BOOLEAN NOT NULL DEFAULT false;
