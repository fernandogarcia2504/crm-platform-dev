import { annexA } from "../data/risk/index.js";

// Salidas calculadas de una evaluación: SoA, mapa de calor y resumen.
// Reciben los documentos ya cargados (lean) para no repetir consultas.

// Declaración de Aplicabilidad (ISO 27001 cl. 6.1.3 d): los 93 controles,
// si aplican, por qué riesgos y su estado de implementación. Un control
// aplica si algún tratamiento lo usa, o si se forzó en soaOverrides
// (ej. requisito regulatorio sin riesgo asociado).
export const buildSoA = (risks, overrides = {}) => {

    const byControl = {};

    risks.forEach((r) => {
        (r.treatments || []).forEach((t) => {
            if (!t.controlCode) return;
            if (!byControl[t.controlCode]) byControl[t.controlCode] = { risks: new Set(), statuses: [] };
            byControl[t.controlCode].risks.add(r.code);
            byControl[t.controlCode].statuses.push(t.status);
        });
    });

    return annexA.controls.map((c) => {
        const hit = byControl[c.code];
        const ov = overrides[c.code] || {};
        const applicable = typeof ov.applicable === "boolean" ? ov.applicable : Boolean(hit);

        let implementation = "No aplica";
        if (applicable) {
            const st = hit ? hit.statuses.filter((s) => s !== "Cancelado") : [];
            if (st.length && st.every((s) => s === "Implementado")) implementation = "Implementado";
            else if (st.some((s) => s === "Implementado" || s === "En proceso")) implementation = "En proceso";
            else implementation = "Pendiente";
        }

        return {
            code: c.code,
            theme: c.themeName,
            name: c.name,
            newIn2022: c.newIn2022,
            applicable,
            justification: ov.justification
                || (applicable
                    ? (hit ? "Seleccionado para tratar riesgos identificados" : "Incluido manualmente")
                    : "Sin riesgos asociados en el alcance evaluado"),
            relatedRisks: hit ? [...hit.risks] : [],
            implementation: ov.implementation || implementation,
            overridden: Boolean(overrides[c.code])
        };
    });
};

// Matriz 3×4 (probabilidad 1–3 × impacto 0–3) con los códigos de riesgo.
// heatmap.inherent[prob - 1][impacto] = ["R-001", ...]
export const buildHeatmap = (risks) => {
    const empty = () => [1, 2, 3].map(() => [0, 1, 2, 3].map(() => []));
    const out = { inherent: empty(), residual: empty() };
    risks.forEach((r) => {
        ["inherent", "residual"].forEach((k) => {
            const e = r[k];
            if (!e || !e.probability || e.impact == null) return;
            out[k][e.probability - 1][Math.min(3, Math.round(e.impact))].push(r.code);
        });
    });
    return out;
};

// Resumen para tarjetas de la plataforma y para el CRM.
export const buildSummary = (risks) => {
    const count = (k) => risks.reduce((acc, r) => {
        const lvl = r[k] && r[k].level;
        if (lvl) acc[lvl] += 1;
        return acc;
    }, { Alto: 0, Medio: 0, Bajo: 0 });

    const treatments = risks.flatMap((r) => r.treatments || []).filter((t) => t.status !== "Cancelado");

    return {
        totalRisks: risks.length,
        inherentByLevel: count("inherent"),
        residualByLevel: count("residual"),
        outsideAppetite: risks.filter((r) => r.withinAppetite === false).length,
        accepted: risks.filter((r) => r.residualAccepted).length,
        treatments: {
            total: treatments.length,
            implemented: treatments.filter((t) => t.status === "Implementado").length
        }
    };
};
