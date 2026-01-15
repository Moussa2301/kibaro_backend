import dotenv from "dotenv";
dotenv.config();

import app from "./app";
import { autoSeedIfEmpty } from "./prisma/autoSeed";

const PORT = Number(process.env.PORT) || 4001;
const HOST = process.env.HOST || "0.0.0.0";

const server = app.listen(PORT, HOST, () => {
  console.log(`🚀 Kibaro History backend running on http://${HOST}:${PORT}`);

  // ✅ on lance l'auto-seed en background (sans bloquer le serveur)
  void (async () => {
    try {
      await autoSeedIfEmpty();
    } catch (err) {
      console.error("❌ Auto-seed failed:", err);
    }
  })();
});

server.on("error", (err: any) => {
  console.error("❌ Server failed to start:", err?.message || err);
  process.exit(1);
});
