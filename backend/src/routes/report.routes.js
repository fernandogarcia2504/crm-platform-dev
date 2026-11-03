import express from "express";
import { generateCampaignReport } from "../controllers/report.controller.js";

const router = express.Router();

router.get("/campaign/:campaignId", generateCampaignReport);

export default router;
