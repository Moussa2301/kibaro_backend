// src/prisma/seed-pack.ts
import prisma from "./client";
import fs from "fs";
import path from "path";

type AnswerInput = { text: string; isCorrect: boolean };
type QuestionInput = { text: string; answers: AnswerInput[] };
type ChapterInput = {
  title: string;
  period: string;
  order: number;
  content: string;
  questions: QuestionInput[];
};
type BadgeInput = {
  title: string;
  description: string;
  icon?: string;
  condition?: string;
};

type PackData = {
  chapters: ChapterInput[];
  badges?: BadgeInput[];
};

const PACKS_DIR = path.resolve(process.cwd(), "packs");

function shuffle<T>(arr: T[]) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

async function upsertChapter(ch: ChapterInput) {
  const existing = await prisma.chapter.findFirst({ where: { title: ch.title } });

  if (!existing) {
    return prisma.chapter.create({
      data: {
        title: ch.title,
        period: ch.period,
        order: ch.order,
        content: ch.content,
      },
    });
  }

  return prisma.chapter.update({
    where: { id: existing.id },
    data: {
      period: ch.period,
      order: ch.order,
      content: ch.content,
    },
  });
}

async function upsertQuestionAndAnswers(chapterId: string, q: QuestionInput) {
  const qText = q.text.trim();

  const existingQ = await prisma.question.findFirst({
    where: { chapterId, text: qText },
    select: { id: true },
  });

  const questionId = existingQ
    ? existingQ.id
    : (
        await prisma.question.create({
          data: { chapterId, text: qText },
          select: { id: true },
        })
      ).id;

  const shuffledAnswers = shuffle(
    q.answers.map((a) => ({
      text: a.text.trim(),
      isCorrect: Boolean(a.isCorrect),
    }))
  );

  for (const a of shuffledAnswers) {
    if (!a.text) continue;

    const existingA = await prisma.answer.findFirst({
      where: { questionId, text: a.text },
      select: { id: true },
    });

    if (!existingA) {
      await prisma.answer.create({
        data: { questionId, text: a.text, isCorrect: a.isCorrect },
      });
    } else {
      await prisma.answer.update({
        where: { id: existingA.id },
        data: { isCorrect: a.isCorrect },
      });
    }
  }
}

async function upsertBadge(b: BadgeInput) {
  const existing = await prisma.badge.findFirst({ where: { title: b.title } });

  if (!existing) {
    await prisma.badge.create({
      data: {
        title: b.title,
        description: b.description,
        icon: b.icon || "",
        condition: b.condition || "",
      },
    });
    return;
  }

  await prisma.badge.update({
    where: { id: existing.id },
    data: {
      description: b.description,
      icon: b.icon ?? existing.icon,
      condition: b.condition ?? existing.condition,
    },
  });
}

async function importPackFile(filePath: string) {
  const raw = fs.readFileSync(filePath, "utf-8");
  const data: PackData = JSON.parse(raw);

  console.log(`📦 Import pack: ${path.basename(filePath)}`);

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
export async function seedPacks() {
  if (!fs.existsSync(PACKS_DIR)) {
    throw new Error(`Dossier packs introuvable: ${PACKS_DIR}`);
  }

  const files = fs
    .readdirSync(PACKS_DIR)
    .filter((f) => f.endsWith(".json"))
    .map((f) => path.join(PACKS_DIR, f));

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
      await prisma.$disconnect();
    });
}
