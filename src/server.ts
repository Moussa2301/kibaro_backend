import dotenv from "dotenv";
dotenv.config();

import app from "./app";

const PORT = Number(process.env.PORT) || 4001;

// ✅ Sur Render, tu n'as pas besoin de HOST.
// Render expose déjà le service correctement.
// (On laisse quand même "0.0.0.0" par sécurité)
const HOST = process.env.HOST || "0.0.0.0";

const server = app.listen(PORT, HOST, () => {
  console.log(`🚀 Kibaro History backend running on http://${HOST}:${PORT}`);
});

// (optionnel mais recommandé) : log si erreur de port / permission
server.on("error", (err: any) => {
  console.error("❌ Server failed to start:", err?.message || err);
  process.exit(1);
});

// arrêt propre (Render / Docker / Ctrl+C)
const shutdown = (signal: string) => {
  console.log(`\n🛑 Received ${signal}. Shutting down...`);

  server.close(() => {
    console.log("✅ HTTP server closed.");
    process.exit(0);
  });

  // force quit si bloqué
  const killer: NodeJS.Timeout = setTimeout(() => process.exit(1), 8000);
  killer.unref();
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
