"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.submitQuizSchema = void 0;
const zod_1 = require("zod");
exports.submitQuizSchema = zod_1.z.object({
    chapterId: zod_1.z.string().uuid(),
    answers: zod_1.z
        .array(zod_1.z.object({
        questionId: zod_1.z.string().uuid(),
        answerId: zod_1.z.string().uuid(),
    }))
        .min(1),
});
