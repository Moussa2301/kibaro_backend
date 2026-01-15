"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const game_controller_1 = require("../controllers/game.controller");
const router = (0, express_1.Router)();
// Base: /api/games
router.post("/", authMiddleware_1.authMiddleware, game_controller_1.createGame);
router.post("/:id/join", authMiddleware_1.authMiddleware, game_controller_1.joinGame);
router.get("/:id", authMiddleware_1.authMiddleware, game_controller_1.getGameById);
router.post("/:id/submit", authMiddleware_1.authMiddleware, game_controller_1.submitGameResult);
// ✅ questions figées du duel
router.get("/:id/questions", authMiddleware_1.authMiddleware, game_controller_1.getGameQuestions);
router.get("/", authMiddleware_1.authMiddleware, game_controller_1.listGames);
exports.default = router;
