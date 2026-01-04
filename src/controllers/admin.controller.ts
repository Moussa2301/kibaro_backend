import { Request, Response } from "express";
import prisma from "../prisma/client";

export const getAdminDashboard = async (_req: Request, res: Response) => {
  try {
    const now = new Date();
    const d7 = new Date(now);
    d7.setDate(d7.getDate() - 7);

    // Utilisateurs
    const [usersTotal, usersLast7d] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { createdAt: { gte: d7 } } }),
    ]);

    // Actifs = au moins 1 score sur 7 jours
    const activeUsersLast7d = await prisma.score
      .findMany({
        where: { createdAt: { gte: d7 } },
        select: { userId: true },
        distinct: ["userId"],
      })
      .then((rows) => rows.length);
    
    

    // Activité (7 jours)
    const [quizPlaysLast7d, duelsLast7d, roomsLast7d] = await Promise.all([
      prisma.score.count({ where: { createdAt: { gte: d7 } } }),
      prisma.game.count({ where: { createdAt: { gte: d7 } } }),
      prisma.room.count({ where: { createdAt: { gte: d7 } } }),
    ]);

    // Classement Top 20
    const leaderboard = await prisma.user.findMany({
      orderBy: { points: "desc" },
      take: 20,
      select: { id: true, username: true, points: true, level: true, createdAt: true },
    });

    // Fréquence par jour (quiz joués) sur 7 jours
    const scores = await prisma.score.findMany({
      where: { createdAt: { gte: d7 } },
      select: { createdAt: true },
    });

    const perDay: Record<string, number> = {};
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
  } catch (err) {
    console.error("getAdminDashboard error", err);
    return res.status(500).json({ msg: "Erreur serveur" });
  }
};
