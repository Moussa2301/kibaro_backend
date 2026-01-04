import { Router } from "express";
import {
  getMyScores,
  getLeaderboard,
  syncOfflineScores,
} from "../controllers/score.controller";
import { authMiddleware, adminMiddleware } from "../middlewares/authMiddleware";
import { validateBody } from "../middlewares/validate";
import { syncOfflineScoresSchema } from "../validation/score.schemas";

const router = Router();

router.get("/me", authMiddleware, getMyScores);
router.get("/leaderboard", getLeaderboard);
router.post(
  "/sync-offline",
  authMiddleware,
  validateBody(syncOfflineScoresSchema),
  syncOfflineScores
);

export default router;
