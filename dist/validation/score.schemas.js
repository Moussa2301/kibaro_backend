"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncOfflineScoresSchema = void 0;
const zod_1 = require("zod");
exports.syncOfflineScoresSchema = zod_1.z.object({
    scores: zod_1.z
        .array(zod_1.z.object({
        points: zod_1.z.number().int().positive(),
        quizType: zod_1.z.string().min(1),
        chapterId: zod_1.z.string().uuid().optional(),
    }))
        .min(1),
});
