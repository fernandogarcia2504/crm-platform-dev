import type { Level, Methodology } from "./types";

// Mismo cálculo que el backend (riskScoring.service.js), para previsualizar
// el nivel mientras se captura. El backend recalcula al guardar.
//   Nivel = Probabilidad (1–3) × Impacto (0–3); Alto >= 6, Medio >= 3, Bajo < 3

const round2 = (n: number) => Math.round(n * 100) / 100;

export const aggregateImpact = (impacts: Record<string, number> | undefined, method = "max") => {
    const values = Object.values(impacts || {}).filter((v) => typeof v === "number" && v >= 0 && v <= 3);
    if (values.length === 0) return 0;
    const max = Math.max(...values);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    if (method === "avg") return round2(avg);
    if (method === "maxAvg") return round2((max + avg) / 2);
    return max;
};

export const levelFor = (score: number): Level => (score >= 6 ? "Alto" : score >= 3 ? "Medio" : "Bajo");

export const evaluate = (
    probability: number | undefined,
    impacts: Record<string, number> | undefined,
    methodology?: Methodology
) => {
    if (!probability) return { impact: null, score: null, level: null as Level | null };
    const impact = aggregateImpact(impacts, methodology?.impactAggregation?.method);
    const score = round2(probability * impact);
    return { impact, score, level: levelFor(score) as Level | null };
};
