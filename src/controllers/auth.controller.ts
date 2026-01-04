import bcrypt from "bcryptjs";
import prisma from "../prisma/client";
import { signToken } from "../utils/jwt";
import { Request, Response } from "express";

const safeUserSelect = {
  id: true,
  username: true,
  email: true,
  role: true,
  points: true,
  level: true,
  createdAt: true,
};

export const register = async (req: Request, res: Response) => {
  const { username, email, password } = req.body;

  const exists = await prisma.user.findFirst({
    where: { OR: [{ email }, { username }] },
    select: { id: true },
  });
  if (exists) return res.status(409).json({ msg: "Utilisateur déjà existant" });

  const hashed = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: { username, email, password: hashed, role: "USER" },
    select: safeUserSelect,
  });

  const token = signToken({ userId: user.id, email: user.email, role: user.role as any });

  return res.status(201).json({ token, user });
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const userWithPassword = await prisma.user.findUnique({
    where: { email },
    select: { ...safeUserSelect, password: true },
  });

  if (!userWithPassword) return res.status(404).json({ msg: "Utilisateur introuvable" });

  const ok = await bcrypt.compare(password, userWithPassword.password);
  if (!ok) return res.status(401).json({ msg: "Mot de passe incorrect" });

  const { password: _pw, ...user } = userWithPassword;

  const token = signToken({ userId: user.id, email: user.email, role: user.role as any });

  return res.json({ token, user });
};
