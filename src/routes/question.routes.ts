import { Router } from "express";
import {
  createQuestionWithAnswers,
  getQuestionsByChapter,
  updateQuestionWithAnswers,
  deleteQuestion,
} from "../controllers/question.controller";
import { authMiddleware, adminMiddleware } from "../middlewares/authMiddleware";

const router = Router();

// liste des questions d'un chapitre (admin)
router.get("/by-chapter/:chapterId", authMiddleware, adminMiddleware, getQuestionsByChapter);

// création de question + réponses pour un chapitre (admin)
router.post("/", authMiddleware, adminMiddleware, createQuestionWithAnswers);

// mise à jour d'une question (admin)
router.put("/:id", authMiddleware, adminMiddleware, updateQuestionWithAnswers);

// suppression d'une question (admin)
router.delete("/:id", authMiddleware, adminMiddleware, deleteQuestion);

export default router;
