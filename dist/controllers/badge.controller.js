"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteBadge = exports.updateBadge = exports.createBadge = exports.refreshMyBadges = exports.getMyBadges = exports.getAllBadges = void 0;
const client_1 = __importDefault(require("../prisma/client"));
const badge_service_1 = require("../services/badge.service");
// Public / user endpoints
const getAllBadges = async (_req, res) => {
    const badges = await client_1.default.badge.findMany({
        orderBy: { title: "asc" },
    });
    res.json(badges);
};
exports.getAllBadges = getAllBadges;
const getMyBadges = async (req, res) => {
    const userId = req.user.userId;
    const badges = await client_1.default.userBadge.findMany({
        where: { userId },
        include: { badge: true },
        orderBy: { date: "desc" },
    });
    res.json(badges.map((ub) => ({
        id: ub.badge.id,
        title: ub.badge.title,
        description: ub.badge.description,
        icon: ub.badge.icon,
        date: ub.date,
    })));
};
exports.getMyBadges = getMyBadges;
const refreshMyBadges = async (req, res) => {
    const userId = req.user.userId;
    const unlocked = await (0, badge_service_1.checkAndUnlockBadges)(userId);
    res.json({ unlocked });
};
exports.refreshMyBadges = refreshMyBadges;
// Admin endpoints
const createBadge = async (req, res) => {
    const { title, description, icon, condition } = req.body;
    if (!title || !description) {
        return res.status(400).json({ msg: "title et description sont requis" });
    }
    try {
        const badge = await client_1.default.badge.create({
            data: {
                title,
                description,
                icon: icon || "",
                condition: condition || "",
            },
        });
        res.status(201).json(badge);
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ msg: "Erreur lors de la création du badge" });
    }
};
exports.createBadge = createBadge;
const updateBadge = async (req, res) => {
    const { id } = req.params;
    const { title, description, icon, condition } = req.body;
    try {
        const badge = await client_1.default.badge.update({
            where: { id },
            data: {
                title,
                description,
                icon: icon || "",
                condition: condition || "",
            },
        });
        res.json(badge);
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ msg: "Erreur lors de la mise à jour du badge" });
    }
};
exports.updateBadge = updateBadge;
const deleteBadge = async (req, res) => {
    const { id } = req.params;
    try {
        // supprimer d'abord les liens user-badge
        await client_1.default.userBadge.deleteMany({ where: { badgeId: id } });
        await client_1.default.badge.delete({ where: { id } });
        res.json({ msg: "Badge supprimé" });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ msg: "Erreur lors de la suppression du badge" });
    }
};
exports.deleteBadge = deleteBadge;
