import { Response } from "express";
import { AuthRequest } from "../middlewares/authMiddleware";
import {
  createGame,
  joinGame,
  getGameById,
  submitGameResult,
  getGameQuestions,
} from "./game.controller";

// ✅ Alias: /duels -> /games (même logique)
export const createDuel = createGame;
export const joinDuel = joinGame;
export const getDuel = getGameById;
export const submitDuelResult = submitGameResult;

// ✅ Questions figées (multi-chapitres random)
export const getDuelQuestions = getGameQuestions;

// ✅ Start manuel (optionnel) : dans ton flow, le duel démarre au join.
// On laisse l’endpoint exister pour éviter de casser, mais on explique.
export const startDuel = async (req: AuthRequest, res: Response) => {
  return res.status(400).json({
    msg: "Start manuel inutile : le duel démarre automatiquement quand le joueur 2 rejoint.",
  });
};
