import { Router } from "express";
import { getAdminDashboard } from "../controllers/admin.controller";
import { authMiddleware, adminMiddleware } from "../middlewares/authMiddleware";
import { getAdminUsers } from "../controllers/admin.controller";
import { adminResetUserPassword } from "../controllers/admin.controller";
const router = Router();

// /api/admin/dashboard
router.get("/dashboard", authMiddleware, adminMiddleware, getAdminDashboard);
router.get("/users", authMiddleware, adminMiddleware, getAdminUsers);
router.post("/users/:id/reset-password", authMiddleware, adminMiddleware, adminResetUserPassword);
export default router;
