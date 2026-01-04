import { Router } from "express";
import {
  getAllBadges,
  getMyBadges,
  refreshMyBadges,
  createBadge,
  updateBadge,
  deleteBadge,
} from "../controllers/badge.controller";
import { authMiddleware, adminMiddleware } from "../middlewares/authMiddleware";

const router = Router();

// Public / user
router.get("/", getAllBadges);
router.get("/me", authMiddleware, getMyBadges);
router.post("/refresh", authMiddleware, refreshMyBadges);

// Admin CRUD
router.post("/", authMiddleware, adminMiddleware, createBadge);
router.put("/:id", authMiddleware, adminMiddleware, updateBadge);
router.delete("/:id", authMiddleware, adminMiddleware, deleteBadge);

export default router;
