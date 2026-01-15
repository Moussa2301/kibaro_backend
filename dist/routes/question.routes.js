"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const question_controller_1 = require("../controllers/question.controller");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const router = (0, express_1.Router)();
// liste des questions d'un chapitre (admin)
router.get("/by-chapter/:chapterId", authMiddleware_1.authMiddleware, authMiddleware_1.adminMiddleware, question_controller_1.getQuestionsByChapter);
// création de question + réponses pour un chapitre (admin)
router.post("/", authMiddleware_1.authMiddleware, authMiddleware_1.adminMiddleware, question_controller_1.createQuestionWithAnswers);
// mise à jour d'une question (admin)
router.put("/:id", authMiddleware_1.authMiddleware, authMiddleware_1.adminMiddleware, question_controller_1.updateQuestionWithAnswers);
// suppression d'une question (admin)
router.delete("/:id", authMiddleware_1.authMiddleware, authMiddleware_1.adminMiddleware, question_controller_1.deleteQuestion);
exports.default = router;
