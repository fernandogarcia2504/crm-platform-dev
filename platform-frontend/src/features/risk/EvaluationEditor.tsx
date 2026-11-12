import type { Dimension, Methodology } from "./types";
import { evaluate } from "./scoring";
import { LevelBadge, ScalePicker } from "./RiskUi";

// Captura de probabilidad + dimensiones de impacto con el nivel calculado en vivo.
// Se usa para riesgo inherente, riesgo residual y oportunidades.
export default function EvaluationEditor({
    methodology, dimensions, probability, impacts, onChange, positive
}: {
    methodology: Methodology;
    dimensions: Dimension[];
    probability?: number;
    impacts: Record<string, number>;
    onChange: (next: { probability?: number; impacts: Record<string, number> }) => void;
    positive?: boolean;
}) {
    const result = evaluate(probability, impacts, methodology);

    const setImpact = (key: string, v: number) => onChange({ probability, impacts: { ...impacts, [key]: v } });

    const groups = dimensions.reduce<Record<string, Dimension[]>>((acc, d) => {
        const g = d.group ?? (positive ? "Impacto positivo" : "Impacto al negocio");
        (acc[g] = acc[g] || []).push(d);
        return acc;
    }, {});

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-md bg-surface-2/60 px-3 py-2.5">
                <div className="flex items-center gap-3">
                    <span className="text-[0.8rem] font-medium">Probabilidad</span>
                    <ScalePicker
                        value={probability}
                        options={methodology.probability}
                        onChange={(v) => onChange({ probability: v, impacts })}
                    />
                    <span className="text-[0.74rem] text-faint">
                        {methodology.probability.find((p) => p.value === probability)?.label ?? "Sin capturar"}
                    </span>
                </div>
                <div className="flex items-center gap-2 text-[0.78rem] text-muted">
                    <span className="tnum">Impacto {result.impact ?? "—"}</span>
                    <span>×</span>
                    <span className="tnum">P {probability ?? "—"}</span>
                    <span>=</span>
                    <LevelBadge level={result.level} score={result.score} />
                </div>
            </div>

            {Object.entries(groups).map(([group, dims]) => (
                <div key={group}>
                    <p className="mb-1.5 text-[0.7rem] font-semibold uppercase tracking-[0.06em] text-faint">
                        {group === "CID" ? "Seguridad de la información (CID)" : group}
                    </p>
                    <div className="grid grid-cols-1 gap-x-6 gap-y-1.5 md:grid-cols-2">
                        {dims.map((d) => (
                            <div key={d.key} className="flex items-center justify-between gap-3 py-0.5">
                                <span className="text-[0.82rem]" title={d.description}>{d.label}</span>
                                <ScalePicker
                                    value={impacts[d.key] ?? 0}
                                    options={methodology.impactScale}
                                    onChange={(v) => setImpact(d.key, v)}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            ))}

            <p className="text-[0.7rem] text-faint">
                Impacto total = {methodology.impactAggregation.method === "max"
                    ? "la mayor de las dimensiones"
                    : methodology.impactAggregation.method === "avg" ? "promedio de las dimensiones" : "promedio entre máximo y promedio"}.
                Escala: 0 Nulo · 1 Bajo · 2 Medio · 3 Alto.
            </p>
        </div>
    );
}
