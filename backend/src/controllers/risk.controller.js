import mongoose from "mongoose";

import RiskAssessment from "../models/riskAssessment.model.js";
import RiskAsset from "../models/riskAsset.model.js";
import Risk from "../models/risk.model.js";
import RiskOpportunity from "../models/riskOpportunity.model.js";
import { methodology, annexA, threats, vulnerabilities, riskSources } from "../data/risk/index.js";
import { evaluate } from "../services/riskScoring.service.js";
import { buildSoA, buildHeatmap, buildSummary } from "../services/riskReports.service.js";

// Línea: Evaluación de Riesgos (ISO 27001:2022 / ISO 27005:2022).
// Proceso: evaluación (proyecto CRM) -> activos -> riesgos (identificación,
// inherente, tratamiento, residual, aceptación) -> SoA y mapa de calor.

const isId = (id) => mongoose.Types.ObjectId.isValid(id);

const fail = (res, error, fallback) => {
    console.error(error);
    if (error?.name === "ValidationError" || error?.name === "CastError") {
        return res.status(400).json({ message: error.message });
    }
    if (error?.code === 11000) {
        return res.status(409).json({ message: "Ya existe un registro con ese código en esta evaluación" });
    }
    return res.status(500).json({ message: fallback });
};

// Campos que el cliente nunca debe escribir directo (calculados o de enlace)
const stripProtected = (body = {}) => {
    const { _id, assessment, createdAt, updatedAt, withinAppetite, ...rest } = body;
    ["inherent", "residual"].forEach((k) => {
        if (rest[k]) {
            const { impact, score, level, ...keep } = rest[k];
            rest[k] = keep;
        }
    });
    if ("impact" in rest || "score" in rest || "level" in rest) {
        delete rest.impact; delete rest.score; delete rest.level;
    }
    return rest;
};

// Siguiente código consecutivo: ACT-001, R-001, OP-001
const nextCode = async (Model, assessmentId, prefix) => {
    const docs = await Model.find({ assessment: assessmentId }).select("code").lean();
    const max = docs.reduce((m, d) => {
        const n = parseInt(String(d.code).replace(/\D/g, ""), 10);
        return Number.isFinite(n) && n > m ? n : m;
    }, 0);
    return `${prefix}-${String(max + 1).padStart(3, "0")}`;
};


// =====================================================================
// CATÁLOGOS
// =====================================================================

export const getCatalogs = async (req, res) => {
    return res.status(200).json({
        catalogs: {
            methodology,
            controls: annexA.controls,
            threats: threats.threats,
            vulnerabilities: vulnerabilities.vulnerabilities,
            riskSources: riskSources.riskSources,
            desiredEndStates: riskSources.desiredEndStates
        }
    });
};

// Previsualización del cálculo (el front también calcula localmente)
export const scorePreview = async (req, res) => {
    return res.status(200).json({ result: evaluate(req.body, req.body?.method) });
};


// =====================================================================
// EVALUACIONES
// =====================================================================

export const getAssessments = async (req, res) => {
    try {
        const { crmCompanyId } = req.params;

        const assessments = await RiskAssessment
            .find({ crmCompanyId })
            .select("-methodology")
            .sort({ createdAt: -1 })
            .lean();

        const ids = assessments.map((a) => a._id);
        const risks = await Risk.find({ assessment: { $in: ids } })
            .select("assessment inherent residual treatments withinAppetite residualAccepted")
            .lean();

        const withSummary = assessments.map((a) => ({
            ...a,
            summary: buildSummary(risks.filter((r) => String(r.assessment) === String(a._id)))
        }));

        return res.status(200).json({ assessments: withSummary });
    } catch (error) {
        return fail(res, error, "Error al obtener las evaluaciones");
    }
};

export const createAssessment = async (req, res) => {
    try {
        const { crmCompanyId, companyName, name } = req.body;

        if (!crmCompanyId || !companyName) {
            return res.status(400).json({ message: "Se requiere la empresa (crmCompanyId y companyName)" });
        }
        if (!name) {
            return res.status(400).json({ message: "El nombre de la evaluación es requerido" });
        }

        const { methodology: _m, soaOverrides: _s, ...rest } = stripProtected(req.body);
        const assessment = await RiskAssessment.create(rest);

        return res.status(201).json({ assessment });
    } catch (error) {
        return fail(res, error, "Error al crear la evaluación");
    }
};

// Detalle completo: evaluación + activos + riesgos + oportunidades + resumen
export const getAssessment = async (req, res) => {
    try {
        const { assessmentId } = req.params;
        if (!isId(assessmentId)) return res.status(400).json({ message: "Id inválido" });

        const assessment = await RiskAssessment.findById(assessmentId).lean();
        if (!assessment) return res.status(404).json({ message: "La evaluación no existe" });

        const [assets, risks, opportunities] = await Promise.all([
            RiskAsset.find({ assessment: assessmentId }).sort({ code: 1 }).lean(),
            Risk.find({ assessment: assessmentId }).sort({ code: 1 }).lean(),
            RiskOpportunity.find({ assessment: assessmentId }).sort({ code: 1 }).lean()
        ]);

        return res.status(200).json({
            assessment,
            assets,
            risks,
            opportunities,
            summary: buildSummary(risks)
        });
    } catch (error) {
        return fail(res, error, "Error al obtener la evaluación");
    }
};

export const updateAssessment = async (req, res) => {
    try {
        const { assessmentId } = req.params;
        if (!isId(assessmentId)) return res.status(400).json({ message: "Id inválido" });

        const assessment = await RiskAssessment.findById(assessmentId);
        if (!assessment) return res.status(404).json({ message: "La evaluación no existe" });

        // La metodología no se edita desde aquí: queda congelada al crear,
        // salvo el método de agregación de impacto.
        const { methodology: m, crmCompanyId, companyName, ...rest } = stripProtected(req.body);
        assessment.set(rest);

        if (m?.impactAggregation?.method && methodology.impactAggregation.options.includes(m.impactAggregation.method)) {
            assessment.methodology = {
                ...assessment.methodology,
                impactAggregation: { ...assessment.methodology.impactAggregation, method: m.impactAggregation.method }
            };
            assessment.markModified("methodology");
        }
        if (rest.soaOverrides) assessment.markModified("soaOverrides");

        await assessment.save();

        // Si cambió el método o el apetito, recalcula todos los riesgos
        if (m || rest.acceptanceLevel) {
            const risks = await Risk.find({ assessment: assessmentId });
            for (const r of risks) await r.save();
        }

        return res.status(200).json({ assessment });
    } catch (error) {
        return fail(res, error, "Error al actualizar la evaluación");
    }
};

export const deleteAssessment = async (req, res) => {
    try {
        const { assessmentId } = req.params;
        if (!isId(assessmentId)) return res.status(400).json({ message: "Id inválido" });

        await Promise.all([
            Risk.deleteMany({ assessment: assessmentId }),
            RiskOpportunity.deleteMany({ assessment: assessmentId }),
            RiskAsset.deleteMany({ assessment: assessmentId })
        ]);
        await RiskAssessment.findByIdAndDelete(assessmentId);

        return res.status(200).json({ message: "Evaluación eliminada" });
    } catch (error) {
        return fail(res, error, "Error al eliminar la evaluación");
    }
};

export const getHeatmap = async (req, res) => {
    try {
        const risks = await Risk.find({ assessment: req.params.assessmentId }).select("code inherent residual").lean();
        return res.status(200).json({ heatmap: buildHeatmap(risks) });
    } catch (error) {
        return fail(res, error, "Error al generar el mapa de calor");
    }
};

export const getSoA = async (req, res) => {
    try {
        const assessment = await RiskAssessment.findById(req.params.assessmentId).select("soaOverrides").lean();
        if (!assessment) return res.status(404).json({ message: "La evaluación no existe" });

        const risks = await Risk.find({ assessment: req.params.assessmentId }).select("code treatments").lean();
        return res.status(200).json({ soa: buildSoA(risks, assessment.soaOverrides || {}) });
    } catch (error) {
        return fail(res, error, "Error al generar la Declaración de Aplicabilidad");
    }
};

// Resumen por proyecto del CRM (para mostrarlo en la ficha del proyecto)
export const getProjectSummary = async (req, res) => {
    try {
        const assessments = await RiskAssessment.find({ crmProjectId: req.params.crmProjectId })
            .select("name status")
            .lean();
        const ids = assessments.map((a) => a._id);
        const risks = await Risk.find({ assessment: { $in: ids } })
            .select("inherent residual treatments withinAppetite residualAccepted")
            .lean();
        return res.status(200).json({ assessments, summary: buildSummary(risks) });
    } catch (error) {
        return fail(res, error, "Error al obtener el resumen");
    }
};


// =====================================================================
// ACTIVOS / RIESGOS / OPORTUNIDADES (mismo patrón CRUD)
// =====================================================================

const makeCrud = ({ Model, key, plural, prefix, label, beforeSave, beforeDelete }) => ({

    create: async (req, res) => {
        try {
            const { assessmentId } = req.params;
            if (!isId(assessmentId)) return res.status(400).json({ message: "Id inválido" });

            const exists = await RiskAssessment.exists({ _id: assessmentId });
            if (!exists) return res.status(404).json({ message: "La evaluación no existe" });

            const body = stripProtected(req.body);
            if (!body.code) body.code = await nextCode(Model, assessmentId, prefix);

            if (beforeSave) {
                const err = await beforeSave(body, assessmentId);
                if (err) return res.status(400).json({ message: err });
            }

            const doc = await Model.create({ ...body, assessment: assessmentId });
            return res.status(201).json({ [key]: doc });
        } catch (error) {
            return fail(res, error, `Error al crear ${label}`);
        }
    },

    update: async (req, res) => {
        try {
            const id = req.params[`${key}Id`];
            if (!isId(id)) return res.status(400).json({ message: "Id inválido" });

            // findById + set + save para que corra el recálculo de niveles
            const doc = await Model.findById(id);
            if (!doc) return res.status(404).json({ message: `No existe ${label}` });

            const body = stripProtected(req.body);
            if (beforeSave) {
                const err = await beforeSave(body, doc.assessment);
                if (err) return res.status(400).json({ message: err });
            }

            doc.set(body);
            await doc.save();
            return res.status(200).json({ [key]: doc });
        } catch (error) {
            return fail(res, error, `Error al actualizar ${label}`);
        }
    },

    remove: async (req, res) => {
        try {
            const id = req.params[`${key}Id`];
            if (!isId(id)) return res.status(400).json({ message: "Id inválido" });

            if (beforeDelete) {
                const err = await beforeDelete(id);
                if (err) return res.status(409).json({ message: err });
            }

            await Model.findByIdAndDelete(id);
            return res.status(200).json({ message: `${plural} eliminado` });
        } catch (error) {
            return fail(res, error, `Error al eliminar ${label}`);
        }
    }
});

// El activo de un riesgo debe pertenecer a la misma evaluación
const checkAsset = async (body, assessmentId) => {
    if (!body.asset) return null;
    if (!isId(body.asset)) return "Activo inválido";
    const ok = await RiskAsset.exists({ _id: body.asset, assessment: assessmentId });
    return ok ? null : "El activo no pertenece a esta evaluación";
};

const assets = makeCrud({
    Model: RiskAsset, key: "asset", plural: "Activo", prefix: "ACT", label: "el activo",
    beforeDelete: async (id) => {
        const used = await Risk.countDocuments({ asset: id });
        return used ? `El activo tiene ${used} riesgo(s) asociado(s); elimínalos o reasígnalos primero` : null;
    }
});

const risks = makeCrud({
    Model: Risk, key: "risk", plural: "Riesgo", prefix: "R", label: "el riesgo",
    beforeSave: checkAsset
});

const opportunities = makeCrud({
    Model: RiskOpportunity, key: "opportunity", plural: "Oportunidad", prefix: "OP", label: "la oportunidad",
    beforeSave: checkAsset
});

export const createAsset = assets.create;
export const updateAsset = assets.update;
export const deleteAsset = assets.remove;

export const createRisk = risks.create;
export const updateRisk = risks.update;
export const deleteRisk = risks.remove;

export const createOpportunity = opportunities.create;
export const updateOpportunity = opportunities.update;
export const deleteOpportunity = opportunities.remove;
