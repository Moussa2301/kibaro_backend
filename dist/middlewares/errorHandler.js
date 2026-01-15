"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const errorHandler = (err, _req, res, _next) => {
    console.error("Erreur serveur :", err);
    res.status(err.status || 500).json({
        msg: err.message || "Erreur interne du serveur",
    });
};
exports.errorHandler = errorHandler;
