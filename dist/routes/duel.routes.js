"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const duel_controller_1 = require("../controllers/duel.controller");
const router = (0, express_1.Router)();
// Base: /api/duels
router.post("/", authMiddleware_1.authMiddleware, duel_controller_1.createDuel);
// ✅ IMPORTANT : plus de joinCode ici, on rejoint par l'ID du duel (comme /games)
router.post("/:id/join", authMiddleware_1.authMiddleware, duel_controller_1.joinDuel);
router.get("/:id", authMiddleware_1.authMiddleware, duel_controller_1.getDuel);
router.post("/:id/start", authMiddleware_1.authMiddleware, duel_controller_1.startDuel);
router.post("/:id/submit", authMiddleware_1.authMiddleware, duel_controller_1.submitDuelResult);
// ✅ questions figées du duel
router.get("/:id/questions", authMiddleware_1.authMiddleware, duel_controller_1.getDuelQuestions);
exports.default = router;
