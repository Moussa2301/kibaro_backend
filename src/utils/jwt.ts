import jwt from "jsonwebtoken";

type Role = "USER" | "ADMIN";

export function signToken(payload: { userId: string; email: string; role: Role }) {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET manquant");

  return jwt.sign(payload, secret, { expiresIn: "7d" });
}
