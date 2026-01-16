import { Router } from "express";
import { getAdminDashboard } from "../controllers/admin.controller";
import { authMiddleware, adminMiddleware } from "../middlewares/authMiddleware";
import { getAdminUsers } from "../controllers/admin.controller";
const router = Router();

// /api/admin/dashboard
router.get("/dashboard", authMiddleware, adminMiddleware, getAdminDashboard);
router.get("/users", authMiddleware, adminMiddleware, getAdminUsers);
export default router;
