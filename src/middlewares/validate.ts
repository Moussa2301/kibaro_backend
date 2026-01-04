import { RequestHandler } from "express";
import { ZodSchema } from "zod";

export const validateBody = (schema: ZodSchema): RequestHandler => {
  return (req, res, next) => {
    const parsed = schema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        msg: "Erreur lors de la validation",
        errors: parsed.error.flatten(),
      });
    }

    req.body = parsed.data;
    next();
  };
};
