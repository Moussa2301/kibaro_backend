"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authMiddleware_1 = require("../middlewares/authMiddleware");
//import { createRoom, joinRoom, getRoom } from "../controllers/room.controller";
const room_controller_1 = require("../controllers/room.controller");
const router = (0, express_1.Router)();
// Base: /api/rooms
router.post("/", authMiddleware_1.authMiddleware, room_controller_1.createRoom);
router.post("/join/:joinCode", authMiddleware_1.authMiddleware, room_controller_1.joinRoom);
router.get("/:id", authMiddleware_1.authMiddleware, room_controller_1.getRoom);
router.post("/:id/start", authMiddleware_1.authMiddleware, room_controller_1.startRoom);
router.post("/:id/submit", authMiddleware_1.authMiddleware, room_controller_1.submitRoomResult);
router.get("/:id/questions", authMiddleware_1.authMiddleware, room_controller_1.getRoomQuestions);
exports.default = router;
