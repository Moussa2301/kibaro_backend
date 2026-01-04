import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";

type Role = "USER" | "ADMIN";

export type AuthRequest = Request & {
  user?: { userId: string; email: string; role: Role };
};

type TokenPayload = JwtPayload & {
  userId: string;
  email: string;
  role: Role;
};

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  const header = req.headers.authorization;

  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ msg: "Token manquant" });
  }

  const token = header.split(" ")[1];
  const secret = process.env.JWT_SECRET;

  if (!secret) return res.status(500).json({ msg: "JWT_SECRET manquant côté serveur" });

  try {
    const decoded = jwt.verify(token, secret) as TokenPayload;

    if (!decoded?.userId || !decoded?.email || !decoded?.role) {
      return res.status(401).json({ msg: "Token invalide (payload incomplet)" });
    }

    req.user = { userId: decoded.userId, email: decoded.email, role: decoded.role };
    return next();
  } catch {
    return res.status(401).json({ msg: "Token invalide ou expiré" });
  }
};

export const adminMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user?.role !== "ADMIN") {
    return res.status(403).json({ msg: "Accès interdit" });
  }
  return next();
};
