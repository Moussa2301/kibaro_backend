import { Request, Response } from "express";
import prisma from "../prisma/client";

export const createQuestionWithAnswers = async (req: Request, res: Response) => {
  const { chapterId, text, answers } = req.body;

  if (!chapterId || !text || !Array.isArray(answers) || answers.length === 0) {
    return res.status(400).json({ msg: "chapterId, text et answers sont requis" });
  }

  try {
    const question = await prisma.question.create({
      data: {
        text,
        chapterId,
        answers: {
          create: answers.map((a: any) => ({
            text: a.text,
            isCorrect: !!a.isCorrect,
          })),
        },
      },
      include: { answers: true },
    });

    res.status(201).json(question);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Erreur lors de la création de la question" });
  }
};

export const getQuestionsByChapter = async (req: Request, res: Response) => {
  const { chapterId } = req.params;
  try {
    const questions = await prisma.question.findMany({
      where: { chapterId },
      include: { answers: true },
      orderBy: { text: "asc" },
    });
    res.json(questions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Erreur lors du chargement des questions" });
  }
};

export const updateQuestionWithAnswers = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { text, answers } = req.body;

  if (!text || !Array.isArray(answers) || answers.length === 0) {
    return res.status(400).json({ msg: "text et answers sont requis" });
  }

  try {
    const existing = await prisma.question.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ msg: "Question introuvable" });
    }

    // supprimer les anciennes réponses
    await prisma.answer.deleteMany({ where: { questionId: id } });

    const question = await prisma.question.update({
      where: { id },
      data: {
        text,
        answers: {
          create: answers.map((a: any) => ({
            text: a.text,
            isCorrect: !!a.isCorrect,
          })),
        },
      },
      include: { answers: true },
    });

    res.json(question);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Erreur lors de la mise à jour de la question" });
  }
};

export const deleteQuestion = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    // supprimer d'abord les réponses
    await prisma.answer.deleteMany({ where: { questionId: id } });
    await prisma.question.delete({ where: { id } });
    res.json({ msg: "Question supprimée" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Erreur lors de la suppression de la question" });
  }
};
