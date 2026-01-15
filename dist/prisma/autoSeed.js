"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.autoSeedIfEmpty = autoSeedIfEmpty;
// src/prisma/autoSeed.ts
const client_1 = __importDefault(require("./client"));
const seed_pack_1 = require("./seed-pack");
async function autoSeedIfEmpty() {
    const chapterCount = await client_1.default.chapter.count();
    if (chapterCount > 0) {
        console.log("ℹ️ Database already seeded, skipping");
        return;
    }
    console.log("🌱 Database empty, running seeds...");
    await (0, seed_pack_1.seedPacks)();
    console.log("✅ Auto-seed completed");
}
