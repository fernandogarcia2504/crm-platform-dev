import express from "express";

import {
    getMe,
    getOverview,
    changePassword
} from "../controllers/clientPortal.controller.js";

const router = express.Router();

router.get("/me", getMe);
router.get("/overview", getOverview);
router.post("/change-password", changePassword);

export default router;
