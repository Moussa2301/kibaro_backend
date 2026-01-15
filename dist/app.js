"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/app.ts
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const morgan_1 = __importDefault(require("morgan"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const chapter_routes_1 = __importDefault(require("./routes/chapter.routes"));
const quiz_routes_1 = __importDefault(require("./routes/quiz.routes"));
const score_routes_1 = __importDefault(require("./routes/score.routes"));
const question_routes_1 = __importDefault(require("./routes/question.routes"));
const badge_routes_1 = __importDefault(require("./routes/badge.routes"));
const game_routes_1 = __importDefault(require("./routes/game.routes"));
const room_routes_1 = __importDefault(require("./routes/room.routes"));
const duel_routes_1 = __importDefault(require("./routes/duel.routes"));
const admin_routes_1 = __importDefault(require("./routes/admin.routes"));
const errorHandler_1 = require("./middlewares/errorHandler");
const app = (0, express_1.default)();
/**
 * ✅ CORS (dev + prod-ready)
 * - autorise localhost + ton domaine frontend en prod (FRONTEND_URL)
 * - autorise aussi Postman/curl (origin absent)
 */
const allowedOrigins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    process.env.FRONTEND_URL, // ex: https://kibaro-history.vercel.app
].filter(Boolean);
const corsOptions = {
    origin: (origin, callback) => {
        // Postman / curl / server-to-server => origin undefined
        if (!origin)
            return callback(null, true);
        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        return callback(new Error(`CORS blocked: ${origin}`));
    },
    credentials: false,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
};
app.use((0, cors_1.default)(corsOptions));
// ✅ Express 5: pas de "*", utiliser une regex
app.options(/.*/, (0, cors_1.default)(corsOptions));
app.use(express_1.default.json());
app.use((0, morgan_1.default)("dev"));
// ✅ Tout passe sous /api
app.use("/api/auth", auth_routes_1.default);
app.use("/api/chapters", chapter_routes_1.default);
app.use("/api/quiz", quiz_routes_1.default);
app.use("/api/scores", score_routes_1.default);
app.use("/api/questions", question_routes_1.default);
app.use("/api/badges", badge_routes_1.default);
app.use("/api/games", game_routes_1.default);
app.use("/api/rooms", room_routes_1.default);
app.use("/api/duels", duel_routes_1.default);
app.use("/api/admin", admin_routes_1.default);
// ✅ Handler d'erreurs (toujours en dernier)
app.use(errorHandler_1.errorHandler);
exports.default = app;
