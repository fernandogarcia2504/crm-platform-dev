import mongoose from "mongoose";

import { methodology } from "../data/risk/index.js";
import { evaluate } from "../services/riskScoring.service.js";

// Hoja "Oportunidades" (ISO 27001 cl. 6.1.1 pide riesgos Y oportunidades).
// Misma mecánica que el riesgo, con impacto positivo.
const impactsShape = {};
methodology.opportunityImpactDimensions.forEach((d) => {
    impactsShape[d.key] = { type: Number, min: 0, max: 3, default: 0 };
});

const RiskOpportunitySchema = new mongoose.Schema({

    assessment: { type: mongoose.Schema.Types.ObjectId, ref: "RiskAssessment", required: true, index: true },
    asset: { type: mongoose.Schema.Types.ObjectId, ref: "RiskAsset", default: null },

    code: { type: String, required: true },     // OP-001
    strength: String,                           // Fortaleza
    opportunity: { type: String, required: true },
    scenario: String,                           // Escenario del aprovechamiento
    probability: { type: Number, min: 1, max: 3 },
    impacts: impactsShape,
    impact: Number,
    score: Number,
    level: String,                              // Nivel de oportunidad
    possibleActions: String,
    actionTaken: String,
    treatment: String,
    owner: String,
    monitoringFrequency: { type: String, enum: [...methodology.monitoringFrequency, null] },
    status: { type: String, enum: methodology.treatmentStatus, default: "Pendiente" },
    effectiveness: { type: String, enum: methodology.effectiveness, default: "No evaluado" },
    notes: String

}, { timestamps: true });

RiskOpportunitySchema.index({ assessment: 1, code: 1 }, { unique: true });

RiskOpportunitySchema.pre("validate", function () {
    const obj = this.toObject();
    const r = evaluate({ probability: obj.probability, impacts: obj.impacts });
    this.impact = r.impact;
    this.score = r.score;
    this.level = r.level;
});

export default mongoose.model("RiskOpportunity", RiskOpportunitySchema);
