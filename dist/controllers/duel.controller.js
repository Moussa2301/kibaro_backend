"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startDuel = exports.getDuelQuestions = exports.submitDuelResult = exports.getDuel = exports.joinDuel = exports.createDuel = void 0;
const game_controller_1 = require("./game.controller");
// ✅ Alias: /duels -> /games (même logique)
exports.createDuel = game_controller_1.createGame;
exports.joinDuel = game_controller_1.joinGame;
exports.getDuel = game_controller_1.getGameById;
exports.submitDuelResult = game_controller_1.submitGameResult;
// ✅ Questions figées (multi-chapitres random)
exports.getDuelQuestions = game_controller_1.getGameQuestions;
// ✅ Start manuel (optionnel) : dans ton flow, le duel démarre au join.
// On laisse l’endpoint exister pour éviter de casser, mais on explique.
const startDuel = async (req, res) => {
    return res.status(400).json({
        msg: "Start manuel inutile : le duel démarre automatiquement quand le joueur 2 rejoint.",
    });
};
exports.startDuel = startDuel;
