// src/controllers/score.controller.ts
import { Request, Response } from "express";
import prisma from "../prisma/client";

// Type du user injecté par ton middleware d'auth
type AuthedRequest = Request & {
  user?: {
    userId: string;
    role: string;
  };
};

/**
 * Récupère les scores du joueur connecté
 * (un score par quiz, puisque syncOfflineScores ne garde que le meilleur)
 */
export const getMyScores = async (req: AuthedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ msg: "Non authentifié" });
    }

    const scores = await prisma.score.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: { chapter: true },
    });

    res.json(scores);
  } catch (err) {
    console.error("Erreur getMyScores:", err);
    res.status(500).json({ msg: "Erreur lors du chargement des scores" });
  }
};

/**
 * Leaderboard : somme des meilleurs scores par utilisateur.
 * Pour chaque (userId, chapterId, quizType), on prend MAX(points),
 * puis on somme ces max par utilisateur.
 */
// src/controllers/score.controller.ts

export const getLeaderboard = async (req: Request, res: Response) => {
  try {
    const limit = Number(req.query.limit ?? 20);

    // 1) MAX(points) par (userId, chapterId, quizType)
    const grouped = await prisma.score.groupBy({
      by: ["userId", "chapterId", "quizType"],
      _max: { points: true },
    });

    // 2) Somme des max par user
    const totalsByUser: Record<string, number> = {};
    for (const g of grouped) {
      const best = g._max.points ?? 0;
      totalsByUser[g.userId] = (totalsByUser[g.userId] ?? 0) + best;
    }

    // 3) Tri + limit
    const sorted = Object.entries(totalsByUser)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit);

    const userIds = sorted.map(([userId]) => userId);

    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, username: true, level: true, createdAt: true },
    });

    const leaderboard = sorted.map(([userId, points]) => {
      const u = users.find((x) => x.id === userId);
      return {
        id: userId,
        username: u?.username ?? "Inconnu",
        points,                 // ✅ IMPORTANT : points (pas totalPoints)
        level: u?.level ?? 1,
        createdAt: u?.createdAt?.toISOString?.() ?? new Date().toISOString(),
      };
    });

    return res.json(leaderboard);
  } catch (err) {
    console.error("Erreur getLeaderboard:", err);
    return res.status(500).json({ msg: "Erreur lors du chargement du classement" });
  }
};

/**
 * Synchronisation des scores offline.
 * Pour chaque score reçu :
 *  - si aucun score n'existe pour (user, chapter, quizType) → on crée
 *  - si un score existe et que le nouveau est meilleur → on met à jour
 *  - si le nouveau est moins bon → on ne fait rien
 */
export const syncOfflineScores = async (req: AuthedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ msg: "Non authentifié" });
    }

    const { scores } = req.body;

    if (!Array.isArray(scores)) {
      return res.status(400).json({ msg: "scores doit être un tableau" });
    }

    const saved: any[] = [];

    for (const s of scores) {
      const { points, quizType, chapterId } = s;

      if (typeof points !== "number" || !quizType) continue;

      // On considère null si pas de chapitre (quiz général par ex.)
      const normalizedChapterId = chapterId ?? null;

      // 1. On cherche un score existant pour ce joueur / chapitre / type de quiz
      const existing = await prisma.score.findFirst({
        where: {
          userId,
          quizType,
          chapterId: normalizedChapterId,
        },
      });

      // 2. Si aucun score → on crée
      if (!existing) {
        const created = await prisma.score.create({
          data: {
            userId,
            points,
            quizType,
            chapterId: normalizedChapterId,
          },
        });
        saved.push(created);
        continue;
      }

      // 3. Si le nouveau score est meilleur → on met à jour
      if (points > existing.points) {
        const updated = await prisma.score.update({
          where: { id: existing.id },
          data: { points },
        });
        saved.push(updated);
      }
      // Si le nouveau score est plus faible ou égal, on ne fait rien
    }

    res.json({ synced: saved.length, scores: saved });
  } catch (err) {
    console.error("Erreur syncOfflineScores:", err);
    res.status(500).json({ msg: "Erreur lors de la synchronisation des scores" });
  }
};
