import mongoose from "mongoose";

// Inventario de activos (columnas "Identificación de activos" de la matriz +
// criticidad de "Criterios riesgos").
const RiskAssetSchema = new mongoose.Schema({

    assessment: { type: mongoose.Schema.Types.ObjectId, ref: "RiskAssessment", required: true, index: true },

    code: { type: String, required: true },     // ID de activo, ej. ACT-001
    name: { type: String, required: true },
    version: String,
    type: {
        type: String,
        enum: ["Información", "Hardware", "Software", "Red", "Personal", "Sitio / instalaciones", "Organización", "Servicio", "Proveedor"],
        required: true
    },
    usage: String,          // Tipo de uso
    owner: String,          // Dueño del activo
    service: String,        // Servicio que soporta
    subService: String,
    operationCriticality: { type: Number, min: 1, max: 3 },
    businessCriticality: { type: Number, min: 1, max: 3 },
    notes: String

}, { timestamps: true });

RiskAssetSchema.index({ assessment: 1, code: 1 }, { unique: true });

export default mongoose.model("RiskAsset", RiskAssetSchema);
