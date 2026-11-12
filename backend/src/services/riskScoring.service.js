import { methodology } from "../data/risk/index.js";

// Cálculo de riesgo (réplica de la hoja "Criterios riesgos" de la matriz):
//   Impacto total  = agregación de las dimensiones de impacto (0–3)
//   Nivel numérico = Probabilidad (1–3) × Impacto total (0–3)  → 0–9
//   Nivel          = Alto (>= 6) | Medio (3 a 5.99) | Bajo (0 a 2.99)
// Coincide con el mapa de calor del Excel: P2×I3 = 6 rojo, P1×I3 = 3 amarillo, P2×I1 = 2 verde.

const round2 = (n) => Math.round(n * 100) / 100;

export const LEVEL_RANK = { Bajo: 1, Medio: 2, Alto: 3 };

export const aggregateImpact = (impacts, method) => {
    const m = method || methodology.impactAggregation.method;
    const values = Object.values(impacts || {})
        .filter((v) => typeof v === "number" && v >= 0 && v <= 3);
    if (values.length === 0) return 0;
    const max = Math.max(...values);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    if (m === "avg") return round2(avg);
    if (m === "maxAvg") return round2((max + avg) / 2);
    return max;
};

export const levelFor = (score) => {
    const levels = [...methodology.levels].sort((a, b) => b.min - a.min);
    const hit = levels.find((l) => score >= l.min);
    return hit ? hit.label : "Bajo";
};

// Recibe { probability, impacts } y devuelve { impact, score, level }
export const evaluate = (block, method) => {
    if (!block || !block.probability) return { impact: null, score: null, level: null };
    const impact = aggregateImpact(block.impacts, method);
    const score = round2(block.probability * impact);
    return { impact, score, level: levelFor(score) };
};

export const isWithinAppetite = (level, acceptanceLevel) => {
    const limit = acceptanceLevel || methodology.defaultAcceptanceLevel;
    return LEVEL_RANK[level] <= LEVEL_RANK[limit];
};
