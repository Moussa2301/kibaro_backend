// src/app.ts
import express from "express";
import cors, { CorsOptions } from "cors";
import morgan from "morgan";

import authRoutes from "./routes/auth.routes";
import chapterRoutes from "./routes/chapter.routes";
import quizRoutes from "./routes/quiz.routes";
import scoreRoutes from "./routes/score.routes";
import questionRoutes from "./routes/question.routes";
import badgeRoutes from "./routes/badge.routes";
import gameRoutes from "./routes/game.routes";
import roomRoutes from "./routes/room.routes";
import duelRoutes from "./routes/duel.routes";
import adminRoutes from "./routes/admin.routes";

import { errorHandler } from "./middlewares/errorHandler";

const app = express();

/**
 * ✅ CORS (dev + prod-ready)
 * - autorise localhost + ton domaine frontend en prod (FRONTEND_URL)
 * - autorise aussi Postman/curl (origin absent)
 */
const allowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  process.env.FRONTEND_URL, // ex: https://kibaro-history.vercel.app
].filter(Boolean) as string[];

const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    // Postman / curl / server-to-server => origin undefined
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error(`CORS blocked: ${origin}`));
  },
  credentials: false,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));

// ✅ Express 5: pas de "*", utiliser une regex
app.options(/.*/, cors(corsOptions));

app.use(express.json());
app.use(morgan("dev"));

// ✅ Tout passe sous /api
app.use("/api/auth", authRoutes);
app.use("/api/chapters", chapterRoutes);
app.use("/api/quiz", quizRoutes);
app.use("/api/scores", scoreRoutes);
app.use("/api/questions", questionRoutes);
app.use("/api/badges", badgeRoutes);
app.use("/api/games", gameRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/duels", duelRoutes);
app.use("/api/admin", adminRoutes);

// ✅ Handler d'erreurs (toujours en dernier)
app.use(errorHandler);

export default app;
