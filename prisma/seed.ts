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
    prisma.category.create({
      data: {
        name: "Juices",
        description: "Freshly squeezed juices",
        sortOrder: 3,
        slug: "juices",
      },
    }),
  ]);

  // Create addons
  const addons = await Promise.all([
    prisma.addon.create({
      data: {
        name: "Extra Berries",
        description: "Additional mixed berries",
        pricePence: 250, // 2.50 pounds
        type: "PAID",
      },
    }),
    prisma.addon.create({
      data: {
        name: "Nuts Package",
        description: "Mixed nuts addition",
        pricePence: 300, // 3.00 pounds
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
    prisma.addon.create({
      data: {
        name: "Protein Shot",
        description: "Extra protein booster for drinks",
        pricePence: 150,
        type: "PAID",
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
          connect: [{ id: addons[0].id }, { id: addons[2].id }],
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
          connect: [{ id: addons[1].id }, { id: addons[2].id }],
        },
      },
    }),
    prisma.product.create({
      data: {
        name: "Green Detox Juice",
        description: "Spinach, kale, apple, and lemon",
        basePricePence: 1299,
        categoryId: categories[2].id,
        maxFreeAddons: 1,
        maxPaidAddons: 1,
        addons: {
          connect: [{ id: addons[3].id }], // Protein Shot
        },
      },
    }),
    prisma.product.create({
      data: {
        name: "Citrus Blast Juice",
        description: "Orange, grapefruit, and a hint of ginger",
        basePricePence: 1399,
        categoryId: categories[2].id,
        maxFreeAddons: 1,
        maxPaidAddons: 1,
        addons: {
          connect: [{ id: addons[2].id }], // Herbal Tea
        },
      },
    }),
    prisma.product.create({
      data: {
        name: "Tropical Fruit Box",
        description: "Mango, pineapple, papaya, and passion fruit",
        basePricePence: 2799,
        categoryId: categories[0].id,
        maxFreeAddons: 1,
        maxPaidAddons: 2,
        addons: {
          connect: [{ id: addons[0].id }, { id: addons[1].id }],
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
