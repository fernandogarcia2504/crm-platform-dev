import mongoose from "mongoose";

import { methodology } from "../data/risk/index.js";

// Una evaluación de riesgos = la OPERACIÓN de un proyecto del CRM con línea
// "Riesgos". Igual que las campañas: referencia al CRM por id, sin acoplamiento.
const RiskAssessmentSchema = new mongoose.Schema({

    // --- enlace al CRM ---
    crmCompanyId: { type: String, required: true, index: true },
    companyName: { type: String, required: true },
    crmProjectId: { type: String, default: null, index: true },
    crmProjectName: { type: String, default: null },

    name: { type: String, required: true },
    scope: String,      // alcance y límites (ISO 27001 cl. 4.3)
    context: String,    // contexto interno/externo y requisitos (CNBV, Banxico, LFPDPPP...)
    framework: { type: String, default: "ISO/IEC 27001:2022" },

    // Copia congelada de la metodología: si después cambian los criterios,
    // las evaluaciones anteriores siguen siendo trazables para auditoría.
    methodology: { type: Object, default: () => JSON.parse(JSON.stringify(methodology)) },

    // Nivel máximo que el cliente acepta sin tratamiento (apetito de riesgo)
    acceptanceLevel: {
        type: String,
        enum: ["Bajo", "Medio", "Alto"],
        default: methodology.defaultAcceptanceLevel
    },

    status: {
        type: String,
        enum: ["Planeada", "En curso", "Tratamiento", "Completada"],
        default: "Planeada"
    },

    startDate: Date,
    endDate: Date,
    reviewFrequency: { type: String, enum: methodology.monitoringFrequency, default: "Anual" },
    nextReviewDate: Date,

    // Ajustes manuales a la Declaración de Aplicabilidad (SoA):
    // { "A.5.31": { applicable: true, justification: "Requisito CNBV", implementation: "Implementado" } }
    soaOverrides: { type: Object, default: () => ({}) },

    notes: String

}, { timestamps: true, minimize: false });

export default mongoose.model("RiskAssessment", RiskAssessmentSchema);
