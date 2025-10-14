import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Create categories
  const categories = await Promise.all([
    prisma.category.create({
      data: {
        name: "Fruit Boxes",
        description: "Fresh seasonal fruit boxes",
        sortOrder: 1,
        slug: "fruit-boxes",
      },
    }),
    prisma.category.create({
      data: {
        name: "Diet Boxes",
        description: "Special diet-friendly meal boxes",
        sortOrder: 2,
        slug: "diet-boxes",
      },
    }),
  ]);

  // Create addons
  const addons = await Promise.all([
    prisma.addon.create({
      data: {
        name: "Extra Berries",
        description: "Additional mixed berries",
        pricePence: 2.5,
        type: "PAID",
      },
    }),
    prisma.addon.create({
      data: {
        name: "Nuts Package",
        description: "Mixed nuts addition",
        pricePence: 3.0,
        type: "PAID",
      },
    }),
    prisma.addon.create({
      data: {
        name: "Herbal Tea",
        description: "Complimentary herbal tea",
        pricePence: 0,
        type: "FREE",
      },
    }),
  ]);

  // Create products
  const products = await Promise.all([
    prisma.product.create({
      data: {
        name: "Summer Fruit Box",
        description:
          "Seasonal summer fruits including berries, melons, and stone fruits",
        basePricePence: 2499,
        categoryId: categories[0].id,
        maxFreeAddons: 1,
        maxPaidAddons: 2,
        addons: {
          create: [{ addonId: addons[0].id }, { addonId: addons[2].id }],
        },
      },
    }),
    prisma.product.create({
      data: {
        name: "Keto Diet Box",
        description: "Low-carb, high-fat meal options perfect for keto diet",
        basePricePence: 3499,
        categoryId: categories[1].id,
        maxFreeAddons: 2,
        maxPaidAddons: 1,
        addons: {
          create: [{ addonId: addons[1].id }, { addonId: addons[2].id }],
        },
      },
    }),
  ]);

  console.log("Seed data created successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
