"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminMiddleware = exports.authMiddleware = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const authMiddleware = (req, res, next) => {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
        return res.status(401).json({ msg: "Token manquant" });
    }
    const token = header.split(" ")[1];
    const secret = process.env.JWT_SECRET;
    if (!secret)
        return res.status(500).json({ msg: "JWT_SECRET manquant côté serveur" });
    try {
        const decoded = jsonwebtoken_1.default.verify(token, secret);
        if (!decoded?.userId || !decoded?.email || !decoded?.role) {
            return res.status(401).json({ msg: "Token invalide (payload incomplet)" });
        }
        req.user = { userId: decoded.userId, email: decoded.email, role: decoded.role };
        return next();
    }
    catch {
        return res.status(401).json({ msg: "Token invalide ou expiré" });
    }
};
exports.authMiddleware = authMiddleware;
const adminMiddleware = (req, res, next) => {
    if (req.user?.role !== "ADMIN") {
        return res.status(403).json({ msg: "Accès interdit" });
    }
    return next();
};
exports.adminMiddleware = adminMiddleware;
