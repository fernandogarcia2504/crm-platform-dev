import mongoose from "mongoose";

import { methodology } from "../data/risk/index.js";
import { evaluate, isWithinAppetite } from "../services/riskScoring.service.js";

// Una fila de la hoja "Riesgos": identificación, evaluación inherente,
// plan de tratamiento, evaluación residual y aceptación.

const impactsShape = {};
methodology.riskImpactDimensions.forEach((d) => {
    impactsShape[d.key] = { type: Number, min: 0, max: 3, default: 0 };
});

const EvaluationSchema = new mongoose.Schema({
    probability: { type: Number, min: 1, max: 3 },
    impacts: impactsShape,
    impact: Number,                                    // calculado
    score: Number,                                     // calculado: P × I
    level: { type: String, enum: ["Bajo", "Medio", "Alto", null] }, // calculado
    evaluatedAt: Date
}, { _id: false });

const TreatmentSchema = new mongoose.Schema({
    possibleActions: String,    // Acciones posibles
    actionTaken: String,        // Acción tomada
    controlCode: String,        // Control del Anexo A, ej. "A.8.8"
    controlDetail: String,      // Control secundario o detalle
    description: String,        // Descripción completa del tratamiento
    owner: String,
    dueDate: Date,
    monitoringFrequency: { type: String, enum: [...methodology.monitoringFrequency, null] },
    status: { type: String, enum: methodology.treatmentStatus, default: "Pendiente" },
    effectiveness: { type: String, enum: methodology.effectiveness, default: "No evaluado" },
    effectivenessDate: Date,
    evidence: String,
    notes: String
}, { timestamps: true });

const RiskSchema = new mongoose.Schema({

    assessment: { type: mongoose.Schema.Types.ObjectId, ref: "RiskAssessment", required: true, index: true },
    asset: { type: mongoose.Schema.Types.ObjectId, ref: "RiskAsset", required: true },

    code: { type: String, required: true },     // R-001
    identifiedAt: { type: Date, default: Date.now },

    // Identificación + enfoque por eventos de ISO 27005:2022
    riskSourceCode: String,         // FR-xx
    desiredEndStateCode: String,    // OB-xx
    threatCode: String,             // AM-xxx-xx
    threatText: String,             // texto libre si no está en catálogo
    vulnerabilityCode: String,      // VU-xxx-xx
    vulnerabilityText: String,
    scenario: { type: String, required: true },
    riskOwner: String,              // dueño del riesgo (quien acepta)

    inherent: { type: EvaluationSchema, default: () => ({}) },
    treatmentOption: { type: String, enum: [...methodology.treatmentOptions, null] },
    treatments: [TreatmentSchema],
    residual: { type: EvaluationSchema, default: () => ({}) },

    // Aceptación del riesgo residual (ISO 27001 cl. 6.1.3 f)
    residualAccepted: { type: Boolean, default: false },
    acceptedBy: String,
    acceptedAt: Date,
    withinAppetite: Boolean,        // calculado
    notes: String

}, { timestamps: true });

RiskSchema.index({ assessment: 1, code: 1 }, { unique: true });

const plain = (sub) => (sub && sub.toObject ? sub.toObject() : sub);

// Recalcula niveles en cada guardado con la metodología congelada de la evaluación
RiskSchema.pre("validate", async function () {
    const RiskAssessment = mongoose.model("RiskAssessment");
    const a = await RiskAssessment.findById(this.assessment).select("methodology acceptanceLevel").lean();
    const method = a?.methodology?.impactAggregation?.method;

    Object.assign(this.inherent, evaluate(plain(this.inherent), method));
    Object.assign(this.residual, evaluate(plain(this.residual), method));

    const effective = this.residual.level || this.inherent.level;
    this.withinAppetite = effective ? isWithinAppetite(effective, a?.acceptanceLevel) : undefined;
});

export default mongoose.model("Risk", RiskSchema);
