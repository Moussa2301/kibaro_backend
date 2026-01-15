"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const admin_controller_1 = require("../controllers/admin.controller");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const router = (0, express_1.Router)();
// /api/admin/dashboard
router.get("/dashboard", authMiddleware_1.authMiddleware, authMiddleware_1.adminMiddleware, admin_controller_1.getAdminDashboard);
exports.default = router;
