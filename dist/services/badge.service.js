"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkAndUnlockBadges = void 0;
const client_1 = __importDefault(require("../prisma/client"));
const checkAndUnlockBadges = async (userId) => {
    const user = await client_1.default.user.findUnique({
        where: { id: userId },
        include: { scores: true, badges: true },
    });
    if (!user)
        return [];
    const unlocked = [];
    const alreadyBadgeIds = user.badges.map((ub) => ub.badgeId);
    const totalPoints = user.scores.reduce((sum, s) => sum + s.points, 0);
    const totalQuizzes = user.scores.length;
    const badgeFirstQuiz = await client_1.default.badge.findFirst({
        where: { title: "Premier pas" },
    });
    if (badgeFirstQuiz &&
        totalQuizzes >= 1 &&
        !alreadyBadgeIds.includes(badgeFirstQuiz.id)) {
        await client_1.default.userBadge.create({
            data: { userId, badgeId: badgeFirstQuiz.id },
        });
        unlocked.push(badgeFirstQuiz.title);
    }
    const badge500 = await client_1.default.badge.findFirst({
        where: { title: "500 points" },
    });
    if (badge500 && totalPoints >= 500 && !alreadyBadgeIds.includes(badge500.id)) {
        await client_1.default.userBadge.create({
            data: { userId, badgeId: badge500.id },
        });
        unlocked.push(badge500.title);
    }
    return unlocked;
};
exports.checkAndUnlockBadges = checkAndUnlockBadges;
