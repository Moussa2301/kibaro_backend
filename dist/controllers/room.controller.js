"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRoomQuestions = exports.submitRoomResult = exports.startRoom = exports.getRoom = exports.joinRoom = exports.createRoom = void 0;
const client_1 = __importDefault(require("../prisma/client"));
const makeCode = (len = 6) => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let out = "";
    for (let i = 0; i < len; i++)
        out += chars[Math.floor(Math.random() * chars.length)];
    return out;
};
const shuffle = (arr) => {
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
};
/**
 * ✅ createRoom
 * - chapterIds[] + questionCount (5..30)
 * - fallback compat: chapterId
 * - questions random parmi tous les chapitres choisis
 * - fige les questions dans RoomQuestion (relation Room.questions)
 * - si pas assez -> prend le max dispo
 */
const createRoom = async (req, res) => {
    try {
        const hostId = req.user.userId;
        const { chapterId, chapterIds, questionCount } = req.body;
        const ids = Array.isArray(chapterIds) && chapterIds.length > 0
            ? chapterIds
            : chapterId
                ? [chapterId]
                : [];
        if (!ids.length)
            return res.status(400).json({ msg: "chapterId ou chapterIds requis" });
        const requested = Math.min(Math.max(Number(questionCount ?? 10), 5), 30);
        // ✅ vérifier chapitres existent (utile quand tu mets en ligne)
        const chapters = await client_1.default.chapter.findMany({
            where: { id: { in: ids } },
            select: { id: true },
        });
        if (chapters.length === 0) {
            return res.status(404).json({ msg: "Chapitres introuvables" });
        }
        // ✅ toutes les questions des chapitres choisis
        const allQuestions = await client_1.default.question.findMany({
            where: { chapterId: { in: ids } },
            select: { id: true },
        });
        if (allQuestions.length === 0) {
            return res.status(400).json({ msg: "Aucune question disponible pour ces chapitres" });
        }
        const pickedIds = shuffle(allQuestions.map((q) => q.id)).slice(0, Math.min(requested, allQuestions.length));
        // joinCode unique
        let joinCode = makeCode();
        while (await client_1.default.room.findUnique({ where: { joinCode } }))
            joinCode = makeCode();
        // ✅ transaction : room + host join + questions figées
        const room = await client_1.default.$transaction(async (tx) => {
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
    }
    catch (err) {
        console.error("createRoom error", err);
        return res.status(500).json({ msg: "Erreur serveur" });
    }
};
exports.createRoom = createRoom;
const joinRoom = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { joinCode } = req.params;
        const room = await client_1.default.room.findUnique({ where: { joinCode } });
        if (!room)
            return res.status(404).json({ msg: "Room introuvable" });
        const exists = await client_1.default.roomPlayer.findUnique({
            where: { roomId_userId: { roomId: room.id, userId } },
        });
        if (!exists) {
            await client_1.default.roomPlayer.create({ data: { roomId: room.id, userId } });
        }
        const full = await client_1.default.room.findUnique({
            where: { id: room.id },
            include: roomInclude,
        });
        return res.json(full);
    }
    catch (err) {
        console.error("joinRoom error", err);
        return res.status(500).json({ msg: "Erreur serveur" });
    }
};
exports.joinRoom = joinRoom;
const getRoom = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { id } = req.params;
        const room = await client_1.default.room.findUnique({
            where: { id },
            include: roomInclude,
        });
        if (!room)
            return res.status(404).json({ msg: "Room introuvable" });
        const isHost = room.hostId === userId;
        const isPlayer = room.players.some((p) => p.userId === userId);
        if (!isHost && !isPlayer)
            return res.status(403).json({ msg: "Accès interdit" });
        return res.json(room);
    }
    catch (err) {
        console.error("getRoom error", err);
        return res.status(500).json({ msg: "Erreur serveur" });
    }
};
exports.getRoom = getRoom;
const startRoom = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { id } = req.params;
        const room = await client_1.default.room.findUnique({ where: { id } });
        if (!room)
            return res.status(404).json({ msg: "Room introuvable" });
        if (room.hostId !== userId)
            return res.status(403).json({ msg: "Seul l'hôte peut démarrer" });
        if (room.status === "RUNNING")
            return res.json(room);
        if (room.status === "FINISHED")
            return res.status(400).json({ msg: "Room déjà terminée" });
        // ✅ sécurité : vérifier qu'il y a des questions figées
        const qCount = await client_1.default.roomQuestion.count({ where: { roomId: id } });
        if (qCount === 0) {
            return res.status(400).json({ msg: "Room invalide : aucune question n'a été générée" });
        }
        const updated = await client_1.default.room.update({
            where: { id },
            data: { status: "RUNNING", startedAt: new Date() },
        });
        return res.json(updated);
    }
    catch (err) {
        console.error("startRoom error", err);
        return res.status(500).json({ msg: "Erreur serveur" });
    }
};
exports.startRoom = startRoom;
const submitRoomResult = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { id } = req.params;
        const { score, time } = req.body;
        if (score === undefined || time === undefined) {
            return res.status(400).json({ msg: "score et time requis" });
        }
        const room = await client_1.default.room.findUnique({ where: { id } });
        if (!room)
            return res.status(404).json({ msg: "Room introuvable" });
        if (room.status !== "RUNNING")
            return res.status(400).json({ msg: "Room pas démarrée" });
        const player = await client_1.default.roomPlayer.findUnique({
            where: { roomId_userId: { roomId: id, userId } },
        });
        if (!player)
            return res.status(403).json({ msg: "Tu n'es pas dans cette room" });
        await client_1.default.roomPlayer.update({
            where: { roomId_userId: { roomId: id, userId } },
            data: { score, time, submittedAt: new Date() },
        });
        const players = await client_1.default.roomPlayer.findMany({ where: { roomId: id } });
        const allSubmitted = players.length > 0 && players.every((p) => p.submittedAt);
        if (allSubmitted) {
            await client_1.default.room.update({
                where: { id },
                data: { status: "FINISHED", finishedAt: new Date() },
            });
        }
        const full = await client_1.default.room.findUnique({
            where: { id },
            include: roomInclude,
        });
        return res.json(full);
    }
    catch (err) {
        console.error("submitRoomResult error", err);
        return res.status(500).json({ msg: "Erreur serveur" });
    }
};
exports.submitRoomResult = submitRoomResult;
const getRoomQuestions = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { id } = req.params;
        const room = await client_1.default.room.findUnique({
            where: { id },
            include: { players: true },
        });
        if (!room)
            return res.status(404).json({ msg: "Room introuvable" });
        const isHost = room.hostId === userId;
        const isPlayer = room.players.some((p) => p.userId === userId);
        if (!isHost && !isPlayer)
            return res.status(403).json({ msg: "Accès interdit" });
        const roomQs = await client_1.default.roomQuestion.findMany({
            where: { roomId: id },
            orderBy: { order: "asc" },
            include: { question: { include: { answers: true } } },
        });
        return res.json(roomQs.map((rq) => rq.question));
    }
    catch (err) {
        console.error("getRoomQuestions error", err);
        return res.status(500).json({ msg: "Erreur serveur" });
    }
};
exports.getRoomQuestions = getRoomQuestions;
