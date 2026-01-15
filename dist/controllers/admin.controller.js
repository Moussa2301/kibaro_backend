"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAdminDashboard = void 0;
const client_1 = __importDefault(require("../prisma/client"));
const getAdminDashboard = async (_req, res) => {
    try {
        const now = new Date();
        const d7 = new Date(now);
        d7.setDate(d7.getDate() - 7);
        // Utilisateurs
        const [usersTotal, usersLast7d] = await Promise.all([
            client_1.default.user.count(),
            client_1.default.user.count({ where: { createdAt: { gte: d7 } } }),
        ]);
        // Actifs = au moins 1 score sur 7 jours
        const activeUsersLast7d = await client_1.default.score
            .findMany({
            where: { createdAt: { gte: d7 } },
            select: { userId: true },
            distinct: ["userId"],
        })
            .then((rows) => rows.length);
        // Activité (7 jours)
        const [quizPlaysLast7d, duelsLast7d, roomsLast7d] = await Promise.all([
            client_1.default.score.count({ where: { createdAt: { gte: d7 } } }),
            client_1.default.game.count({ where: { createdAt: { gte: d7 } } }),
            client_1.default.room.count({ where: { createdAt: { gte: d7 } } }),
        ]);
        // Classement Top 20
        const leaderboard = await client_1.default.user.findMany({
            orderBy: { points: "desc" },
            take: 20,
            select: { id: true, username: true, points: true, level: true, createdAt: true },
        });
        // Fréquence par jour (quiz joués) sur 7 jours
        const scores = await client_1.default.score.findMany({
            where: { createdAt: { gte: d7 } },
            select: { createdAt: true },
        });
        const perDay = {};
        for (const s of scores) {
            const day = s.createdAt.toISOString().slice(0, 10); // YYYY-MM-DD
            perDay[day] = (perDay[day] || 0) + 1;
        }
        return res.json({
            users: {
                total: usersTotal,
                newLast7d: usersLast7d,
                activeLast7d: activeUsersLast7d,
            },
            activityLast7d: {
                quizPlays: quizPlaysLast7d,
                duels: duelsLast7d,
                rooms: roomsLast7d,
            },
            leaderboard,
            frequency: {
                quizPlaysPerDay: perDay,
            },
        });
    }
    catch (err) {
        console.error("getAdminDashboard error", err);
        return res.status(500).json({ msg: "Erreur serveur" });
    }
};
exports.getAdminDashboard = getAdminDashboard;
