"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const admin_controller_1 = require("../controllers/admin.controller");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const admin_controller_2 = require("../controllers/admin.controller");
const admin_controller_3 = require("../controllers/admin.controller");
const router = (0, express_1.Router)();
// /api/admin/dashboard
router.get("/dashboard", authMiddleware_1.authMiddleware, authMiddleware_1.adminMiddleware, admin_controller_1.getAdminDashboard);
router.get("/users", authMiddleware_1.authMiddleware, authMiddleware_1.adminMiddleware, admin_controller_2.getAdminUsers);
router.post("/users/:id/reset-password", authMiddleware_1.authMiddleware, authMiddleware_1.adminMiddleware, admin_controller_3.adminResetUserPassword);
exports.default = router;
