import { Router } from "express";
import {
  getChapters,
  getChapterById,
  createChapter,
  updateChapter,
  deleteChapter,
} from "../controllers/chapter.controller";
import { authMiddleware, adminMiddleware } from "../middlewares/authMiddleware";
import { validateBody } from "../middlewares/validate";
import { createChapterSchema } from "../validation/chapter.schemas";

const router = Router();

router.get("/", getChapters);
router.get("/:id", getChapterById);

router.post(
  "/",
  authMiddleware,
  adminMiddleware,
  validateBody(createChapterSchema),
  createChapter
);
router.put(
  "/:id",
  authMiddleware,
  adminMiddleware,
  validateBody(createChapterSchema),
  updateChapter
);
router.delete("/:id", authMiddleware, adminMiddleware, deleteChapter);

export default router;
