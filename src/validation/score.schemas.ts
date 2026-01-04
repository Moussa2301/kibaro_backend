import { z } from "zod";

export const syncOfflineScoresSchema = z.object({
  scores: z
    .array(
      z.object({
        points: z.number().int().positive(),
        quizType: z.string().min(1),
        chapterId: z.string().uuid().optional(),
      })
    )
    .min(1),
});
