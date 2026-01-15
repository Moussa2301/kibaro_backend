"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.submitChapterQuiz = exports.getChapterQuiz = void 0;
const quiz_service_1 = require("../services/quiz.service");
const client_1 = __importDefault(require("../prisma/client"));
const getChapterQuiz = async (req, res) => {
    try {
        const { chapterId } = req.params;
        const chapter = await client_1.default.chapter.findUnique({
            where: { id: chapterId },
            select: {
                id: true,
                title: true,
                questions: {
                    select: {
                        id: true,
                        text: true,
                        answers: {
                            select: { id: true, text: true, isCorrect: true }, // ✅ ne pas envoyer isCorrect au client
                        },
                    },
                },
            },
        });
        if (!chapter)
            return res.status(404).json({ msg: "Chapitre introuvable" });
        return res.json({
            chapterId: chapter.id,
            title: chapter.title,
            questions: chapter.questions,
        });
    }
    catch (err) {
        console.error("getChapterQuiz error", err);
        return res.status(500).json({ msg: "Erreur serveur" });
    }
};
exports.getChapterQuiz = getChapterQuiz;
const submitChapterQuiz = async (req, res) => {
    try {
        const { chapterId, answers, quizType } = req.body;
        if (!chapterId || !Array.isArray(answers)) {
            return res.status(400).json({ msg: "Données invalides" });
        }
        const userId = req.user?.userId;
        if (!userId)
            return res.status(401).json({ msg: "Non authentifié" });
        const result = await (0, quiz_service_1.evaluateQuiz)(userId, chapterId, answers, quizType ?? "SOLO");
        return res.json(result);
    }
    catch (err) {
        console.error("submitChapterQuiz error", err);
        return res.status(500).json({ msg: "Erreur serveur" });
    }
};
exports.submitChapterQuiz = submitChapterQuiz;
