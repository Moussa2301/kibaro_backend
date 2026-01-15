"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedPacks = seedPacks;
// src/prisma/seed-pack.ts
const client_1 = __importDefault(require("./client"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const PACKS_DIR = path_1.default.resolve(process.cwd(), "packs");
function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}
async function upsertChapter(ch) {
    const existing = await client_1.default.chapter.findFirst({ where: { title: ch.title } });
    if (!existing) {
        return client_1.default.chapter.create({
            data: {
                title: ch.title,
                period: ch.period,
                order: ch.order,
                content: ch.content,
            },
        });
    }
    return client_1.default.chapter.update({
        where: { id: existing.id },
        data: {
            period: ch.period,
            order: ch.order,
            content: ch.content,
        },
    });
}
async function upsertQuestionAndAnswers(chapterId, q) {
    const qText = q.text.trim();
    const existingQ = await client_1.default.question.findFirst({
        where: { chapterId, text: qText },
        select: { id: true },
    });
    const questionId = existingQ
        ? existingQ.id
        : (await client_1.default.question.create({
            data: { chapterId, text: qText },
            select: { id: true },
        })).id;
    const shuffledAnswers = shuffle(q.answers.map((a) => ({
        text: a.text.trim(),
        isCorrect: Boolean(a.isCorrect),
    })));
    for (const a of shuffledAnswers) {
        if (!a.text)
            continue;
        const existingA = await client_1.default.answer.findFirst({
            where: { questionId, text: a.text },
            select: { id: true },
        });
        if (!existingA) {
            await client_1.default.answer.create({
                data: { questionId, text: a.text, isCorrect: a.isCorrect },
            });
        }
        else {
            await client_1.default.answer.update({
                where: { id: existingA.id },
                data: { isCorrect: a.isCorrect },
            });
        }
    }
}
async function upsertBadge(b) {
    const existing = await client_1.default.badge.findFirst({ where: { title: b.title } });
    if (!existing) {
        await client_1.default.badge.create({
            data: {
                title: b.title,
                description: b.description,
                icon: b.icon || "",
                condition: b.condition || "",
            },
        });
        return;
    }
    await client_1.default.badge.update({
        where: { id: existing.id },
        data: {
            description: b.description,
            icon: b.icon ?? existing.icon,
            condition: b.condition ?? existing.condition,
        },
    });
}
async function importPackFile(filePath) {
    const raw = fs_1.default.readFileSync(filePath, "utf-8");
    const data = JSON.parse(raw);
    console.log(`📦 Import pack: ${path_1.default.basename(filePath)}`);
    for (const ch of data.chapters) {
        const chapter = await upsertChapter(ch);
        for (const q of ch.questions) {
            await upsertQuestionAndAnswers(chapter.id, q);
        }
    }
    if (data.badges?.length) {
        for (const b of data.badges) {
            await upsertBadge(b);
        }
    }
}
// ✅ Export: utilisable en Pre-Deploy Command
async function seedPacks() {
    if (!fs_1.default.existsSync(PACKS_DIR)) {
        throw new Error(`Dossier packs introuvable: ${PACKS_DIR}`);
    }
    const files = fs_1.default
        .readdirSync(PACKS_DIR)
        .filter((f) => f.endsWith(".json"))
        .map((f) => path_1.default.join(PACKS_DIR, f));
    if (!files.length) {
        console.log("⚠️ Aucun fichier JSON trouvé dans packs/");
        return;
    }
    console.log(`📚 ${files.length} pack(s) détecté(s) dans packs/`);
    for (const file of files) {
        await importPackFile(file);
    }
    console.log("✅ Import terminé (sans doublon).");
}
// ✅ Si lancé en ligne de commande: node dist/prisma/seed-pack.js
if (require.main === module) {
    seedPacks()
        .catch((e) => {
        console.error("❌ Seed error:", e);
        process.exit(1);
    })
        .finally(async () => {
        await client_1.default.$disconnect();
    });
}
