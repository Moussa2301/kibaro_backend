// src/services/quiz.service.ts
import prisma from "../prisma/client";

type AnyAnswerPayload = {
  questionId: string;
  answerId?: string;
  answerIds?: string[];
  selectedAnswerId?: string;
  selectedAnswerIds?: string[];
  answerIndex?: number;
  answerText?: string;
};

async function recomputeUserPoints(tx: any, userId: string) {
  // On somme les meilleurs scores par (chapterId, quizType)
  const grouped = await tx.score.groupBy({
    by: ["userId", "chapterId", "quizType"],
    where: { userId },
    _max: { points: true },
  });

  const totalPoints = grouped.reduce((sum: number, g: any) => sum + (g._max.points ?? 0), 0);

  const updatedUser = await tx.user.update({
    where: { id: userId },
    data: { points: totalPoints },
    select: { id: true, username: true, points: true, level: true, role: true },
  });

  const newLevel = Math.floor(updatedUser.points / 100) + 1;

  if (newLevel !== updatedUser.level) {
    return await tx.user.update({
      where: { id: userId },
      data: { level: newLevel },
      select: { id: true, username: true, points: true, level: true, role: true },
    });
  }

  return updatedUser;
}

async function checkAndUnlockBadgesTx(tx: any, userId: string) {
  const user = await tx.user.findUnique({
    where: { id: userId },
    include: { badges: true, scores: true },
  });
  if (!user) return [];

  const unlocked: string[] = [];
  const alreadyBadgeIds = user.badges.map((ub: any) => ub.badgeId);

  // ✅ totalPoints = points recalculés (pas somme brute des tentatives)
  // On préfère recalculer via groupBy max, sinon tu donnes trop de points
  const grouped = await tx.score.groupBy({
    by: ["userId", "chapterId", "quizType"],
    where: { userId },
    _max: { points: true },
  });

  const totalPoints = grouped.reduce((sum: number, g: any) => sum + (g._max.points ?? 0), 0);
  const totalQuizzes = await tx.score.count({ where: { userId } });

  const badgeFirstQuiz = await tx.badge.findFirst({ where: { title: "Premier pas" } });
  if (badgeFirstQuiz && totalQuizzes >= 1 && !alreadyBadgeIds.includes(badgeFirstQuiz.id)) {
    await tx.userBadge.create({ data: { userId, badgeId: badgeFirstQuiz.id } });
    unlocked.push(badgeFirstQuiz.title);
  }

  const badge500 = await tx.badge.findFirst({ where: { title: "500 points" } });
  if (badge500 && totalPoints >= 500 && !alreadyBadgeIds.includes(badge500.id)) {
    await tx.userBadge.create({ data: { userId, badgeId: badge500.id } });
    unlocked.push(badge500.title);
  }

  return unlocked;
}

export async function evaluateQuiz(
  userId: string,
  chapterId: string,
  answers: AnyAnswerPayload[],
  quizType: string = "SOLO"
) {
  const questionIds = answers.map((a) => a.questionId);

  const questions = await prisma.question.findMany({
    where: { id: { in: questionIds }, chapterId },
    select: {
      id: true,
      answers: { select: { id: true, text: true, isCorrect: true } },
    },
  });

  const byQuestion = new Map<
    string,
    { all: { id: string; text: string; isCorrect: boolean }[]; correct: Set<string> }
  >();

  for (const q of questions) {
    byQuestion.set(q.id, {
      all: q.answers,
      correct: new Set(q.answers.filter((x) => x.isCorrect).map((x) => x.id)),
    });
  }

  let correctCount = 0;

  for (const a of answers) {
    const q = byQuestion.get(a.questionId);
    if (!q) continue;

    let pickedIds: string[] = [];

    if (a.answerId) pickedIds = [a.answerId];
    if (a.selectedAnswerId) pickedIds = [a.selectedAnswerId];

    if (Array.isArray(a.answerIds)) pickedIds = a.answerIds;
    if (Array.isArray(a.selectedAnswerIds)) pickedIds = a.selectedAnswerIds;

    if (pickedIds.length === 0 && typeof a.answerIndex === "number") {
      const found = q.all[a.answerIndex];
      if (found?.id) pickedIds = [found.id];
    }

    if (pickedIds.length === 0 && a.answerText) {
      const found = q.all.find((x) => x.text.trim() === a.answerText!.trim());
      if (found?.id) pickedIds = [found.id];
    }

    if (pickedIds.length === 0) continue;

    const submitted = new Set(pickedIds);
    const correctSet = q.correct;

    if (submitted.size === 1 && correctSet.size === 1) {
      const only = [...submitted][0];
      if (correctSet.has(only)) correctCount++;
    } else {
      const sameSize = submitted.size === correctSet.size;
      const allMatch = [...correctSet].every((id) => submitted.has(id));
      if (sameSize && allMatch) correctCount++;
    }
  }

  const earnedPoints = correctCount * 10;

  const result = await prisma.$transaction(async (tx) => {
    // ✅ On garde le meilleur score par (userId, chapterId, quizType)
    const existing = await tx.score.findFirst({
      where: { userId, chapterId, quizType },
      orderBy: { createdAt: "desc" },
    });

    let applied = false;

    if (!existing) {
      await tx.score.create({
        data: { userId, chapterId, quizType, points: earnedPoints },
      });
      applied = true;
    } else if (earnedPoints > existing.points) {
      await tx.score.update({
        where: { id: existing.id },
        data: { points: earnedPoints },
      });
      applied = true;
    }

    // ✅ On recalcule points globaux (stable)
    const user = await recomputeUserPoints(tx, userId);

    // ✅ Badges (dans la même transaction)
    const unlockedBadges = await checkAndUnlockBadgesTx(tx, userId);

    return { user, applied, unlockedBadges };
  });

  return {
    ok: true,
    earnedPoints,
    correctCount,
    total: answers.length,
    applied: result.applied, // true si nouveau record appliqué
    unlockedBadges: result.unlockedBadges,
    user: result.user,
  };
}
