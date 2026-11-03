import express from "express";

import {
    createCampaign,
    getCampaigns,
    getCampaign,
    updateCampaign,
    updateTargetEvent,
    launchCampaign,
    syncCampaignResults,
    deleteCampaign
} from "../controllers/campaign.controller.js";

const router = express.Router();

router.post("/", createCampaign);
router.get("/company/:crmCompanyId", getCampaigns);

router.get("/:campaignId", getCampaign);
router.put("/:campaignId", updateCampaign);
router.post("/:campaignId/launch", launchCampaign);
router.post("/:campaignId/sync", syncCampaignResults);
router.patch("/:campaignId/targets/:targetId", updateTargetEvent);
router.delete("/:campaignId", deleteCampaign);

export default router;
