import { Router } from "express";
import { authMiddleware } from "../middlewares/authMiddleware";
import {
  createGame,
  joinGame,
  getGameById,
  submitGameResult,
  listGames,
  getGameQuestions,
} from "../controllers/game.controller";

const router = Router();

// Base: /api/games
router.post("/", authMiddleware, createGame);
router.post("/:id/join", authMiddleware, joinGame);
router.get("/:id", authMiddleware, getGameById);
router.post("/:id/submit", authMiddleware, submitGameResult);

// ✅ questions figées du duel
router.get("/:id/questions", authMiddleware, getGameQuestions);

router.get("/", authMiddleware, listGames);

export default router;
