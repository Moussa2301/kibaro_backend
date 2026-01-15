"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const app_1 = __importDefault(require("./app"));
const autoSeed_1 = require("./prisma/autoSeed");
const PORT = Number(process.env.PORT) || 4001;
const HOST = process.env.HOST || "0.0.0.0";
const server = app_1.default.listen(PORT, HOST, () => {
    console.log(`🚀 Kibaro History backend running on http://${HOST}:${PORT}`);
    // ✅ on lance l'auto-seed en background (sans bloquer le serveur)
    void (async () => {
        try {
            await (0, autoSeed_1.autoSeedIfEmpty)();
        }
        catch (err) {
            console.error("❌ Auto-seed failed:", err);
        }
    })();
});
server.on("error", (err) => {
    console.error("❌ Server failed to start:", err?.message || err);
    process.exit(1);
});
