import { z } from "zod";

export const submitQuizSchema = z.object({
  chapterId: z.string().uuid(),
  answers: z
    .array(
      z.object({
        questionId: z.string().uuid(),
        answerId: z.string().uuid(),
      })
    )
    .min(1),
});
