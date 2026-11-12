import express from "express";

import {
    getCatalogs,
    scorePreview,
    getAssessments,
    createAssessment,
    getAssessment,
    updateAssessment,
    deleteAssessment,
    getHeatmap,
    getSoA,
    getProjectSummary,
    createAsset,
    updateAsset,
    deleteAsset,
    createRisk,
    updateRisk,
    deleteRisk,
    createOpportunity,
    updateOpportunity,
    deleteOpportunity
} from "../controllers/risk.controller.js";

const router = express.Router();

// Catálogos ISO 27001/27005 + metodología
router.get("/catalogs", getCatalogs);
router.post("/score", scorePreview);

// Evaluaciones
router.get("/assessments/company/:crmCompanyId", getAssessments);
router.get("/assessments/project/:crmProjectId/summary", getProjectSummary);
router.post("/assessments", createAssessment);
router.get("/assessments/:assessmentId", getAssessment);
router.put("/assessments/:assessmentId", updateAssessment);
router.delete("/assessments/:assessmentId", deleteAssessment);
router.get("/assessments/:assessmentId/heatmap", getHeatmap);
router.get("/assessments/:assessmentId/soa", getSoA);

// Activos
router.post("/assessments/:assessmentId/assets", createAsset);
router.put("/assets/:assetId", updateAsset);
router.delete("/assets/:assetId", deleteAsset);

// Riesgos
router.post("/assessments/:assessmentId/risks", createRisk);
router.put("/risks/:riskId", updateRisk);
router.delete("/risks/:riskId", deleteRisk);

// Oportunidades
router.post("/assessments/:assessmentId/opportunities", createOpportunity);
router.put("/opportunities/:opportunityId", updateOpportunity);
router.delete("/opportunities/:opportunityId", deleteOpportunity);

export default router;
