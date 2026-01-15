"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteChapter = exports.updateChapter = exports.createChapter = exports.getChapterById = exports.getChapters = void 0;
const client_1 = __importDefault(require("../prisma/client"));
const getChapters = async (_req, res) => {
    const chapters = await client_1.default.chapter.findMany({
        orderBy: { order: "asc" },
    });
    res.json(chapters);
};
exports.getChapters = getChapters;
const getChapterById = async (req, res) => {
    const { id } = req.params;
    const chapter = await client_1.default.chapter.findUnique({
        where: { id },
        include: { questions: { include: { answers: true } } },
    });
    if (!chapter)
        return res.status(404).json({ msg: "Chapitre introuvable" });
    res.json(chapter);
};
exports.getChapterById = getChapterById;
const createChapter = async (req, res) => {
    const { title, content, period, order } = req.body;
    const chapter = await client_1.default.chapter.create({
        data: { title, content, period, order },
    });
    res.status(201).json(chapter);
};
exports.createChapter = createChapter;
const updateChapter = async (req, res) => {
    const { id } = req.params;
    const { title, content, period, order } = req.body;
    try {
        const chapter = await client_1.default.chapter.update({
            where: { id },
            data: { title, content, period, order },
        });
        res.json(chapter);
    }
    catch {
        res.status(404).json({ msg: "Chapitre introuvable" });
    }
};
exports.updateChapter = updateChapter;
const deleteChapter = async (req, res) => {
    const { id } = req.params;
    try {
        await client_1.default.chapter.delete({ where: { id } });
        res.json({ msg: "Chapitre supprimé" });
    }
    catch {
        res.status(404).json({ msg: "Chapitre introuvable" });
    }
};
exports.deleteChapter = deleteChapter;
