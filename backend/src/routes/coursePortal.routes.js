import express from "express";

import {
    getMe,
    getMyCourse,
    completeModule,
    submitQuiz,
    changePassword
} from "../controllers/coursePortal.controller.js";

const router = express.Router();

router.get("/me", getMe);
router.get("/course", getMyCourse);
router.post("/modules/:moduleId/complete", completeModule);
router.post("/modules/:moduleId/quiz", submitQuiz);
router.post("/change-password", changePassword);

export default router;
