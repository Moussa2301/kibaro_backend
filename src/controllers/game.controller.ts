import { Response } from "express";
import prisma from "../prisma/client";
import { AuthRequest } from "../middlewares/authMiddleware";

type CreateGameBody = {
  // rétro-compat
  chapterId?: string;

  // ✅ nouveau
  chapterIds?: string[];
  questionCount?: number; // 5 → 30
};

type SubmitBody = {
  score: number;
  time: number;
};

const clamp = (n: number, min: number, max: number) => Math.min(Math.max(n, min), max);

const shuffle = <T,>(arr: T[]) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

export const createGame = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;

    const { chapterId, chapterIds, questionCount } = req.body as CreateGameBody;

    // ✅ transition douce : chapterIds > chapterId
    const ids =
      Array.isArray(chapterIds) && chapterIds.length > 0
        ? chapterIds
        : chapterId
        ? [chapterId]
        : [];

    if (!ids.length) return res.status(400).json({ msg: "chapterId ou chapterIds requis" });

    // ✅ 5 → 30
    const requested = clamp(Number(questionCount ?? 10), 5, 30);

    // ✅ vérifier que les chapitres existent
    const chapters = await prisma.chapter.findMany({
      where: { id: { in: ids } },
      select: { id: true },
    });

    if (chapters.length !== ids.length) {
      return res.status(404).json({ msg: "Un ou plusieurs chapitres sont introuvables" });
    }

    // ✅ Toutes les questions des chapitres choisis
    const allQuestions = await prisma.question.findMany({
      where: { chapterId: { in: ids } },
      select: { id: true },
    });

    if (allQuestions.length === 0) {
      return res.status(400).json({ msg: "Aucune question disponible pour ces chapitres" });
    }

    const pickedIds = shuffle(allQuestions.map((q) => q.id)).slice(
      0,
      Math.min(requested, allQuestions.length)
    );

    // ✅ Crée le duel + fige la liste des questions (GameQuestion)
    const game = await prisma.game.create({
      data: {
        // rétro-compat : on garde le 1er chapitre en chapterId
        chapterId: ids[0],
        player1Id: userId,
        status: "PENDING",

        // ✅ stocke le nb souhaité (et permet d’afficher "18/30 dispo")
        questionCount: requested,

        // ✅ relation correcte (dans prisma: Game.questions -> GameQuestion[])
        questions: {
          create: pickedIds.map((questionId, order) => ({
            questionId,
            order,
          })),
        },
      },
      include: {
        chapter: true,
        player1: { select: { id: true, username: true } },
        player2: { select: { id: true, username: true } },
      },
    });

    return res.status(201).json({
      ...game,
      questionsAvailable: allQuestions.length,
      questionsPicked: pickedIds.length,
      requestedQuestions: requested,
      chaptersSelected: ids.length,
    });
  } catch (err) {
    console.error("createGame error", err);
    return res.status(500).json({ msg: "Erreur serveur lors de la création du duel" });
  }
};

export const listGames = async (req: AuthRequest, res: Response) => {
  const games = await prisma.game.findMany({
    orderBy: { createdAt: "desc" },
    take: 30,
  });
  res.json(games);
};

export const joinGame = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    const game = await prisma.game.findUnique({ where: { id } });
    if (!game) return res.status(404).json({ msg: "Partie introuvable" });

    if (game.player1Id === userId) {
      return res.status(400).json({ msg: "Tu ne peux pas rejoindre ton propre duel" });
    }

    if (game.status !== "PENDING") {
      return res.status(400).json({ msg: "Cette partie n'est plus disponible" });
    }

    const updated = await prisma.game.update({
      where: { id },
      data: {
        player2Id: userId,
        status: "RUNNING",
        startedAt: new Date(),
      },
      include: {
        chapter: true,
        player1: { select: { id: true, username: true } },
        player2: { select: { id: true, username: true } },
      },
    });

    res.json(updated);
  } catch (err) {
    console.error("joinGame error", err);
    res.status(500).json({ msg: "Erreur serveur lors du join" });
  }
};

export const getGameById = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    const game = await prisma.game.findUnique({
      where: { id },
      include: {
        chapter: true,
        player1: { select: { id: true, username: true } },
        player2: { select: { id: true, username: true } },
      },
    });

    if (!game) return res.status(404).json({ msg: "Partie introuvable" });

    const allowed = game.player1Id === userId || game.player2Id === userId;
    if (!allowed) return res.status(403).json({ msg: "Accès interdit" });

    res.json(game);
  } catch (err) {
    console.error("getGameById error", err);
    res.status(500).json({ msg: "Erreur serveur" });
  }
};

export const submitGameResult = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;
    const { score, time } = req.body as SubmitBody;

    if (score === undefined || time === undefined) {
      return res.status(400).json({ msg: "score et time requis" });
    }

    const game = await prisma.game.findUnique({ where: { id } });
    if (!game) return res.status(404).json({ msg: "Partie introuvable" });

    const isP1 = game.player1Id === userId;
    const isP2 = game.player2Id === userId;

    if (!isP1 && !isP2) return res.status(403).json({ msg: "Accès interdit" });
    if (game.status === "FINISHED") return res.status(400).json({ msg: "Partie déjà terminée" });
    if (game.status !== "RUNNING") return res.status(400).json({ msg: "Partie pas démarrée" });

    const data: any = {};
    if (isP1) {
      data.player1Score = score;
      data.player1Time = time;
    } else {
      data.player2Score = score;
      data.player2Time = time;
    }

    let updated = await prisma.game.update({ where: { id }, data });

    const bothSubmitted =
      updated.player1Score !== null &&
      updated.player1Score !== undefined &&
      updated.player2Score !== null &&
      updated.player2Score !== undefined;

    if (bothSubmitted) {
      updated = await prisma.game.update({
        where: { id },
        data: {
          status: "FINISHED",
          finishedAt: new Date(),
        },
      });
    }

    const full = await prisma.game.findUnique({
      where: { id },
      include: {
        chapter: true,
        player1: { select: { id: true, username: true } },
        player2: { select: { id: true, username: true } },
      },
    });

    res.json(full);
  } catch (err) {
    console.error("submitGameResult error", err);
    res.status(500).json({ msg: "Erreur serveur lors de la soumission" });
  }
};

// ✅ NOUVEAU : questions figées du duel (ordre + réponses)
export const getGameQuestions = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    const game = await prisma.game.findUnique({
      where: { id },
      select: { player1Id: true, player2Id: true },
    });

    if (!game) return res.status(404).json({ msg: "Partie introuvable" });

    const allowed = game.player1Id === userId || game.player2Id === userId;
    if (!allowed) return res.status(403).json({ msg: "Accès interdit" });

    const gameQs = await prisma.gameQuestion.findMany({
      where: { gameId: id },
      orderBy: { order: "asc" },
      include: { question: { include: { answers: true } } },
    });

    return res.json(gameQs.map((gq) => gq.question));
  } catch (err) {
    console.error("getGameQuestions error", err);
    return res.status(500).json({ msg: "Erreur serveur" });
  }
};
