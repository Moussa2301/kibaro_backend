import { Router } from "express";
import { authMiddleware } from "../middlewares/authMiddleware";
import {
  createDuel,
  joinDuel,
  getDuel,
  startDuel,
  submitDuelResult,
  getDuelQuestions,
} from "../controllers/duel.controller";

const router = Router();

// Base: /api/duels
router.post("/", authMiddleware, createDuel);

// ✅ IMPORTANT : plus de joinCode ici, on rejoint par l'ID du duel (comme /games)
router.post("/:id/join", authMiddleware, joinDuel);

router.get("/:id", authMiddleware, getDuel);
router.post("/:id/start", authMiddleware, startDuel);
router.post("/:id/submit", authMiddleware, submitDuelResult);

// ✅ questions figées du duel
router.get("/:id/questions", authMiddleware, getDuelQuestions);

export default router;
