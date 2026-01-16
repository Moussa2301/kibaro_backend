import { Request, Response } from "express";
import prisma from "../prisma/client";
import bcrypt from "bcryptjs";

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

    // ✅ Classement (points réels) = somme des scores par user
    const leaderboardAgg = await prisma.score.groupBy({
      by: ["userId"],
      _sum: { points: true },
      orderBy: { _sum: { points: "desc" } },
      take: 1000000, // ✅ au lieu de 20 (mets 100 si tu veux)
    });

    const userIds = leaderboardAgg.map((x) => x.userId);

    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, username: true, level: true, createdAt: true },
    });

    const uMap = new Map(users.map((u) => [u.id, u]));

    const leaderboard = leaderboardAgg.map((x) => {
      const u = uMap.get(x.userId);
      return {
        id: x.userId,
        username: u?.username ?? "—",
        level: u?.level ?? 1,
        createdAt: u?.createdAt ?? null,
        points: x._sum.points ?? 0,
      };
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

export const getAdminUsers = async (req: Request, res: Response) => {
  try {
    const takeRaw = Number(req.query.take ?? 50);
    const take = Math.min(Math.max(takeRaw, 10), 200); // max 200 par page (safe)
    const cursor = req.query.cursor ? String(req.query.cursor) : null;

    const users = await prisma.user.findMany({
      take: take + 1, // +1 pour savoir s'il y a une page suivante
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        username: true,
        email: true,
        points: true,
        level: true,
        role: true,
        createdAt: true,
      },
    });

    const hasNextPage = users.length > take;
    const items = hasNextPage ? users.slice(0, take) : users;
    const nextCursor = hasNextPage ? items[items.length - 1].id : null;

    return res.json({
      items,
      nextCursor,
      hasNextPage,
    });
  } catch (err) {
    console.error("getAdminUsers error", err);
    return res.status(500).json({ msg: "Erreur serveur" });
  }
};
function generateTempPassword(len = 10) {
  // Simple + lisible (évite les caractères ambigus)
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789@#";
  let out = "";
  for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

export const adminResetUserPassword = async (req: Request, res: Response) => {
  try {
    const userId = req.params.id;

    // (Optionnel mais conseillé) : empêcher reset d’un autre admin, ou de soi-même
    const target = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, role: true } });
    if (!target) return res.status(404).json({ msg: "Utilisateur introuvable" });

    // Génère un mot de passe temporaire
    const tempPassword = generateTempPassword(12);
    const hash = await bcrypt.hash(tempPassword, 10);

    await prisma.user.update({
      where: { id: userId },
      data: {
        password: hash,
        // BONUS recommandé si tu ajoutes ce champ en DB :
        // mustChangePassword: true,
      },
    });

    // IMPORTANT: on renvoie le mdp temporaire UNE SEULE fois
    return res.json({
      ok: true,
      tempPassword,
      msg: "Mot de passe réinitialisé. Transmets le mot de passe temporaire à l'utilisateur.",
    });
  } catch (err) {
    console.error("adminResetUserPassword error", err);
    return res.status(500).json({ msg: "Erreur serveur" });
  }
};