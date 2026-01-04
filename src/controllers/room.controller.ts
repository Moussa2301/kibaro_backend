import { Response } from "express";
import prisma from "../prisma/client";
import { AuthRequest } from "../middlewares/authMiddleware";

const makeCode = (len = 6) => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
};

const shuffle = <T,>(arr: T[]) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const roomInclude = {
  Chapter: true,
  host: { select: { id: true, username: true } },
  players: {
    select: {
      id: true,
      userId: true,
      joinedAt: true,
      submittedAt: true,
      score: true,
      time: true,
      user: { select: { id: true, username: true } },
    },
  },
} as const;

/**
 * ✅ createRoom
 * - chapterIds[] + questionCount (5..30)
 * - fallback compat: chapterId
 * - questions random parmi tous les chapitres choisis
 * - fige les questions dans RoomQuestion (relation Room.questions)
 * - si pas assez -> prend le max dispo
 */
export const createRoom = async (req: AuthRequest, res: Response) => {
  try {
    const hostId = req.user!.userId;

    const { chapterId, chapterIds, questionCount } = req.body as {
      chapterId?: string;
      chapterIds?: string[];
      questionCount?: number;
    };

    const ids =
      Array.isArray(chapterIds) && chapterIds.length > 0
        ? chapterIds
        : chapterId
        ? [chapterId]
        : [];

    if (!ids.length) return res.status(400).json({ msg: "chapterId ou chapterIds requis" });

    const requested = Math.min(Math.max(Number(questionCount ?? 10), 5), 30);

    // ✅ vérifier chapitres existent (utile quand tu mets en ligne)
    const chapters = await prisma.chapter.findMany({
      where: { id: { in: ids } },
      select: { id: true },
    });
    if (chapters.length === 0) {
      return res.status(404).json({ msg: "Chapitres introuvables" });
    }

    // ✅ toutes les questions des chapitres choisis
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

    // joinCode unique
    let joinCode = makeCode();
    while (await prisma.room.findUnique({ where: { joinCode } })) joinCode = makeCode();

    // ✅ transaction : room + host join + questions figées
    const room = await prisma.$transaction(async (tx) => {
      const created = await tx.room.create({
        data: {
          joinCode,
          hostId,
          status: "WAITING",
          chapterId: ids[0], // rétro-compat
          questionCount: requested,
          players: { create: [{ userId: hostId }] },
        },
        include: roomInclude,
      });

      // fige questions
      await tx.roomQuestion.createMany({
        data: pickedIds.map((questionId, order) => ({
          roomId: created.id,
          questionId,
          order,
        })),
      });

      return created;
    });

    return res.status(201).json({
      ...room,
      questionsAvailable: allQuestions.length,
      questionsPicked: pickedIds.length,
      requestedQuestions: requested,
      chaptersSelected: ids.length,
    });
  } catch (err) {
    console.error("createRoom error", err);
    return res.status(500).json({ msg: "Erreur serveur" });
  }
};

export const joinRoom = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { joinCode } = req.params;

    const room = await prisma.room.findUnique({ where: { joinCode } });
    if (!room) return res.status(404).json({ msg: "Room introuvable" });

    const exists = await prisma.roomPlayer.findUnique({
      where: { roomId_userId: { roomId: room.id, userId } },
    });

    if (!exists) {
      await prisma.roomPlayer.create({ data: { roomId: room.id, userId } });
    }

    const full = await prisma.room.findUnique({
      where: { id: room.id },
      include: roomInclude,
    });

    return res.json(full);
  } catch (err) {
    console.error("joinRoom error", err);
    return res.status(500).json({ msg: "Erreur serveur" });
  }
};

export const getRoom = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    const room = await prisma.room.findUnique({
      where: { id },
      include: roomInclude,
    });

    if (!room) return res.status(404).json({ msg: "Room introuvable" });

    const isHost = room.hostId === userId;
    const isPlayer = room.players.some((p) => p.userId === userId);
    if (!isHost && !isPlayer) return res.status(403).json({ msg: "Accès interdit" });

    return res.json(room);
  } catch (err) {
    console.error("getRoom error", err);
    return res.status(500).json({ msg: "Erreur serveur" });
  }
};

export const startRoom = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    const room = await prisma.room.findUnique({ where: { id } });
    if (!room) return res.status(404).json({ msg: "Room introuvable" });

    if (room.hostId !== userId) return res.status(403).json({ msg: "Seul l'hôte peut démarrer" });

    if (room.status === "RUNNING") return res.json(room);
    if (room.status === "FINISHED") return res.status(400).json({ msg: "Room déjà terminée" });

    // ✅ sécurité : vérifier qu'il y a des questions figées
    const qCount = await prisma.roomQuestion.count({ where: { roomId: id } });
    if (qCount === 0) {
      return res.status(400).json({ msg: "Room invalide : aucune question n'a été générée" });
    }

    const updated = await prisma.room.update({
      where: { id },
      data: { status: "RUNNING", startedAt: new Date() },
    });

    return res.json(updated);
  } catch (err) {
    console.error("startRoom error", err);
    return res.status(500).json({ msg: "Erreur serveur" });
  }
};

export const submitRoomResult = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;
    const { score, time } = req.body as { score: number; time: number };

    if (score === undefined || time === undefined) {
      return res.status(400).json({ msg: "score et time requis" });
    }

    const room = await prisma.room.findUnique({ where: { id } });
    if (!room) return res.status(404).json({ msg: "Room introuvable" });
    if (room.status !== "RUNNING") return res.status(400).json({ msg: "Room pas démarrée" });

    const player = await prisma.roomPlayer.findUnique({
      where: { roomId_userId: { roomId: id, userId } },
    });
    if (!player) return res.status(403).json({ msg: "Tu n'es pas dans cette room" });

    await prisma.roomPlayer.update({
      where: { roomId_userId: { roomId: id, userId } },
      data: { score, time, submittedAt: new Date() },
    });

    const players = await prisma.roomPlayer.findMany({ where: { roomId: id } });
    const allSubmitted = players.length > 0 && players.every((p) => p.submittedAt);

    if (allSubmitted) {
      await prisma.room.update({
        where: { id },
        data: { status: "FINISHED", finishedAt: new Date() },
      });
    }

    const full = await prisma.room.findUnique({
      where: { id },
      include: roomInclude,
    });

    return res.json(full);
  } catch (err) {
    console.error("submitRoomResult error", err);
    return res.status(500).json({ msg: "Erreur serveur" });
  }
};

export const getRoomQuestions = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    const room = await prisma.room.findUnique({
      where: { id },
      include: { players: true },
    });

    if (!room) return res.status(404).json({ msg: "Room introuvable" });

    const isHost = room.hostId === userId;
    const isPlayer = room.players.some((p) => p.userId === userId);
    if (!isHost && !isPlayer) return res.status(403).json({ msg: "Accès interdit" });

    const roomQs = await prisma.roomQuestion.findMany({
      where: { roomId: id },
      orderBy: { order: "asc" },
      include: { question: { include: { answers: true } } },
    });

    return res.json(roomQs.map((rq) => rq.question));
  } catch (err) {
    console.error("getRoomQuestions error", err);
    return res.status(500).json({ msg: "Erreur serveur" });
  }
};
