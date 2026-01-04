import { Request, Response } from "express";
import prisma from "../prisma/client";

export const getChapters = async (_req: Request, res: Response) => {
  const chapters = await prisma.chapter.findMany({
    orderBy: { order: "asc" },
  });
  res.json(chapters);
};

export const getChapterById = async (req: Request, res: Response) => {
  const { id } = req.params;
  const chapter = await prisma.chapter.findUnique({
    where: { id },
    include: { questions: { include: { answers: true } } },
  });
  if (!chapter) return res.status(404).json({ msg: "Chapitre introuvable" });
  res.json(chapter);
};

export const createChapter = async (req: Request, res: Response) => {
  const { title, content, period, order } = req.body;
  const chapter = await prisma.chapter.create({
    data: { title, content, period, order },
  });
  res.status(201).json(chapter);
};

export const updateChapter = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { title, content, period, order } = req.body;
  try {
    const chapter = await prisma.chapter.update({
      where: { id },
      data: { title, content, period, order },
    });
    res.json(chapter);
  } catch {
    res.status(404).json({ msg: "Chapitre introuvable" });
  }
};

export const deleteChapter = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    await prisma.chapter.delete({ where: { id } });
    res.json({ msg: "Chapitre supprimé" });
  } catch {
    res.status(404).json({ msg: "Chapitre introuvable" });
  }
};
