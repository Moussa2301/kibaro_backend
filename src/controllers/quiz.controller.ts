// src/controllers/quiz.controller.ts
import { Request, Response } from "express";
import { evaluateQuiz } from "../services/quiz.service";
import prisma from "../prisma/client";

export const getChapterQuiz = async (req: Request, res: Response) => {
  try {
    const { chapterId } = req.params;

    const chapter = await prisma.chapter.findUnique({
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

    if (!chapter) return res.status(404).json({ msg: "Chapitre introuvable" });

    return res.json({
      chapterId: chapter.id,
      title: chapter.title,
      questions: chapter.questions,
    });
  } catch (err) {
    console.error("getChapterQuiz error", err);
    return res.status(500).json({ msg: "Erreur serveur" });
  }
};

export const submitChapterQuiz = async (req: any, res: Response) => {
  try {
    const { chapterId, answers, quizType } = req.body;

    if (!chapterId || !Array.isArray(answers)) {
      return res.status(400).json({ msg: "Données invalides" });
    }

    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ msg: "Non authentifié" });

    const result = await evaluateQuiz(userId, chapterId, answers, quizType ?? "SOLO");

    return res.json(result);
  } catch (err) {
    console.error("submitChapterQuiz error", err);
    return res.status(500).json({ msg: "Erreur serveur" });
  }
};
