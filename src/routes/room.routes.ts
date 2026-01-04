import { Router } from "express";
import { authMiddleware } from "../middlewares/authMiddleware";
//import { createRoom, joinRoom, getRoom } from "../controllers/room.controller";
import { createRoom, joinRoom, getRoom, startRoom, submitRoomResult, getRoomQuestions } from "../controllers/room.controller";

const router = Router();

// Base: /api/rooms
router.post("/", authMiddleware, createRoom);
router.post("/join/:joinCode", authMiddleware, joinRoom);
router.get("/:id", authMiddleware, getRoom);
router.post("/:id/start", authMiddleware, startRoom);
router.post("/:id/submit", authMiddleware, submitRoomResult);
router.get("/:id/questions", authMiddleware, getRoomQuestions);

export default router;
