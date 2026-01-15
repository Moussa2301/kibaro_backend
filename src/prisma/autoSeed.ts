// src/prisma/autoSeed.ts
import prisma from "./client";
import { seedPacks } from "./seed-pack";

export async function autoSeedIfEmpty() {
  const chapterCount = await prisma.chapter.count();

  if (chapterCount > 0) {
    console.log("ℹ️ Database already seeded, skipping");
    return;
  }

  console.log("🌱 Database empty, running seeds...");
  await seedPacks();
  console.log("✅ Auto-seed completed");
}
