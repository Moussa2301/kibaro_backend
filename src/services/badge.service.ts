import prisma from "../prisma/client";

export const checkAndUnlockBadges = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { scores: true, badges: true },
  });
  if (!user) return [];

  const unlocked: string[] = [];

  const alreadyBadgeIds = user.badges.map((ub) => ub.badgeId);

  const totalPoints = user.scores.reduce((sum, s) => sum + s.points, 0);
  const totalQuizzes = user.scores.length;

  const badgeFirstQuiz = await prisma.badge.findFirst({
    where: { title: "Premier pas" },
  });
  if (
    badgeFirstQuiz &&
    totalQuizzes >= 1 &&
    !alreadyBadgeIds.includes(badgeFirstQuiz.id)
  ) {
    await prisma.userBadge.create({
      data: { userId, badgeId: badgeFirstQuiz.id },
    });
    unlocked.push(badgeFirstQuiz.title);
  }

  const badge500 = await prisma.badge.findFirst({
    where: { title: "500 points" },
  });
  if (badge500 && totalPoints >= 500 && !alreadyBadgeIds.includes(badge500.id)) {
    await prisma.userBadge.create({
      data: { userId, badgeId: badge500.id },
    });
    unlocked.push(badge500.title);
  }

  return unlocked;
};
