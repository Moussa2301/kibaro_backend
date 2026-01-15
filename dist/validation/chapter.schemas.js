"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createChapterSchema = void 0;
const zod_1 = require("zod");
exports.createChapterSchema = zod_1.z.object({
    title: zod_1.z.string().min(3),
    content: zod_1.z.string().min(10),
    period: zod_1.z.string().min(3),
    order: zod_1.z.number().int().nonnegative(),
});
