import { Request, Response } from "express";
import prisma from "../prisma/client";
import { checkAndUnlockBadges } from "../services/badge.service";

// Public / user endpoints

export const getAllBadges = async (_req: Request, res: Response) => {
  const badges = await prisma.badge.findMany({
    orderBy: { title: "asc" },
  });
  res.json(badges);
};

export const getMyBadges = async (req: any, res: Response) => {
  const userId = req.user.userId;
  const badges = await prisma.userBadge.findMany({
    where: { userId },
    include: { badge: true },
    orderBy: { date: "desc" },
  });

  res.json(
    badges.map((ub) => ({
      id: ub.badge.id,
      title: ub.badge.title,
      description: ub.badge.description,
      icon: ub.badge.icon,
      date: ub.date,
    }))
  );
};

export const refreshMyBadges = async (req: any, res: Response) => {
  const userId = req.user.userId;
  const unlocked = await checkAndUnlockBadges(userId);
  res.json({ unlocked });
};

// Admin endpoints

export const createBadge = async (req: Request, res: Response) => {
  const { title, description, icon, condition } = req.body;

  if (!title || !description) {
    return res.status(400).json({ msg: "title et description sont requis" });
  }

  try {
    const badge = await prisma.badge.create({
      data: {
        title,
        description,
        icon: icon || "",
        condition: condition || "",
      },
    });
    res.status(201).json(badge);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Erreur lors de la création du badge" });
  }
};

export const updateBadge = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { title, description, icon, condition } = req.body;

  try {
    const badge = await prisma.badge.update({
      where: { id },
      data: {
        title,
        description,
        icon: icon || "",
        condition: condition || "",
      },
    });
    res.json(badge);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Erreur lors de la mise à jour du badge" });
  }
};

export const deleteBadge = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    // supprimer d'abord les liens user-badge
    await prisma.userBadge.deleteMany({ where: { badgeId: id } });
    await prisma.badge.delete({ where: { id } });
    res.json({ msg: "Badge supprimé" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Erreur lors de la suppression du badge" });
  }
};
