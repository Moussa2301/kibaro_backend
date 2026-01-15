"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteQuestion = exports.updateQuestionWithAnswers = exports.getQuestionsByChapter = exports.createQuestionWithAnswers = void 0;
const client_1 = __importDefault(require("../prisma/client"));
const createQuestionWithAnswers = async (req, res) => {
    const { chapterId, text, answers } = req.body;
    if (!chapterId || !text || !Array.isArray(answers) || answers.length === 0) {
        return res.status(400).json({ msg: "chapterId, text et answers sont requis" });
    }
    try {
        const question = await client_1.default.question.create({
            data: {
                text,
                chapterId,
                answers: {
                    create: answers.map((a) => ({
                        text: a.text,
                        isCorrect: !!a.isCorrect,
                    })),
                },
            },
            include: { answers: true },
        });
        res.status(201).json(question);
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ msg: "Erreur lors de la création de la question" });
    }
};
exports.createQuestionWithAnswers = createQuestionWithAnswers;
const getQuestionsByChapter = async (req, res) => {
    const { chapterId } = req.params;
    try {
        const questions = await client_1.default.question.findMany({
            where: { chapterId },
            include: { answers: true },
            orderBy: { text: "asc" },
        });
        res.json(questions);
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ msg: "Erreur lors du chargement des questions" });
    }
};
exports.getQuestionsByChapter = getQuestionsByChapter;
const updateQuestionWithAnswers = async (req, res) => {
    const { id } = req.params;
    const { text, answers } = req.body;
    if (!text || !Array.isArray(answers) || answers.length === 0) {
        return res.status(400).json({ msg: "text et answers sont requis" });
    }
    try {
        const existing = await client_1.default.question.findUnique({ where: { id } });
        if (!existing) {
            return res.status(404).json({ msg: "Question introuvable" });
        }
        // supprimer les anciennes réponses
        await client_1.default.answer.deleteMany({ where: { questionId: id } });
        const question = await client_1.default.question.update({
            where: { id },
            data: {
                text,
                answers: {
                    create: answers.map((a) => ({
                        text: a.text,
                        isCorrect: !!a.isCorrect,
                    })),
                },
            },
            include: { answers: true },
        });
        res.json(question);
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ msg: "Erreur lors de la mise à jour de la question" });
    }
};
exports.updateQuestionWithAnswers = updateQuestionWithAnswers;
const deleteQuestion = async (req, res) => {
    const { id } = req.params;
    try {
        // supprimer d'abord les réponses
        await client_1.default.answer.deleteMany({ where: { questionId: id } });
        await client_1.default.question.delete({ where: { id } });
        res.json({ msg: "Question supprimée" });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ msg: "Erreur lors de la suppression de la question" });
    }
};
exports.deleteQuestion = deleteQuestion;
