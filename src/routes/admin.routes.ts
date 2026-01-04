import { Router } from "express";
import { getAdminDashboard } from "../controllers/admin.controller";
import { authMiddleware, adminMiddleware } from "../middlewares/authMiddleware";

const router = Router();

// /api/admin/dashboard
router.get("/dashboard", authMiddleware, adminMiddleware, getAdminDashboard);

export default router;
