"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = exports.register = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const client_1 = __importDefault(require("../prisma/client"));
const jwt_1 = require("../utils/jwt");
const safeUserSelect = {
    id: true,
    username: true,
    email: true,
    role: true,
    points: true,
    level: true,
    createdAt: true,
};
const register = async (req, res) => {
    const { username, email, password } = req.body;
    const exists = await client_1.default.user.findFirst({
        where: { OR: [{ email }, { username }] },
        select: { id: true },
    });
    if (exists)
        return res.status(409).json({ msg: "Utilisateur déjà existant" });
    const hashed = await bcryptjs_1.default.hash(password, 10);
    const user = await client_1.default.user.create({
        data: { username, email, password: hashed, role: "USER" },
        select: safeUserSelect,
    });
    const token = (0, jwt_1.signToken)({ userId: user.id, email: user.email, role: user.role });
    return res.status(201).json({ token, user });
};
exports.register = register;
const login = async (req, res) => {
    const { email, password } = req.body;
    const userWithPassword = await client_1.default.user.findUnique({
        where: { email },
        select: { ...safeUserSelect, password: true },
    });
    if (!userWithPassword)
        return res.status(404).json({ msg: "Utilisateur introuvable" });
    const ok = await bcryptjs_1.default.compare(password, userWithPassword.password);
    if (!ok)
        return res.status(401).json({ msg: "Mot de passe incorrect" });
    const { password: _pw, ...user } = userWithPassword;
    const token = (0, jwt_1.signToken)({ userId: user.id, email: user.email, role: user.role });
    return res.json({ token, user });
};
exports.login = login;
