import { Router } from "express";
import { getChapterQuiz, submitChapterQuiz } from "../controllers/quiz.controller";
import { validateBody } from "../middlewares/validate";
import { submitQuizSchema } from "../validation/quiz.schemas";
import { authMiddleware } from "../middlewares/authMiddleware";


const router = Router();

router.get("/chapter/:chapterId", authMiddleware, getChapterQuiz);
router.post(
  "/chapter/submit",
  authMiddleware,
  validateBody(submitQuizSchema),
  submitChapterQuiz
);

export default router;
