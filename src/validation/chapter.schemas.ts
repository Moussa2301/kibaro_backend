import { z } from "zod";

export const createChapterSchema = z.object({
  title: z.string().min(3),
  content: z.string().min(10),
  period: z.string().min(3),
  order: z.number().int().nonnegative(),
});
