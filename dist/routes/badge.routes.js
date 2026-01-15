"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const badge_controller_1 = require("../controllers/badge.controller");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const router = (0, express_1.Router)();
// Public / user
router.get("/", badge_controller_1.getAllBadges);
router.get("/me", authMiddleware_1.authMiddleware, badge_controller_1.getMyBadges);
router.post("/refresh", authMiddleware_1.authMiddleware, badge_controller_1.refreshMyBadges);
// Admin CRUD
router.post("/", authMiddleware_1.authMiddleware, authMiddleware_1.adminMiddleware, badge_controller_1.createBadge);
router.put("/:id", authMiddleware_1.authMiddleware, authMiddleware_1.adminMiddleware, badge_controller_1.updateBadge);
router.delete("/:id", authMiddleware_1.authMiddleware, authMiddleware_1.adminMiddleware, badge_controller_1.deleteBadge);
exports.default = router;
