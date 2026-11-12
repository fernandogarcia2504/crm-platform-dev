import type { Level, Methodology, Risk } from "./types";
import { levelFor } from "./scoring";
import { levelBg } from "./riskHelpers";

// Matriz Probabilidad × Impacto, igual a la de "Criterios riesgos":
// filas = impacto (3 arriba), columnas = probabilidad (1 a 3).
export default function HeatmapTab({ methodology, risks }: { methodology: Methodology; risks: Risk[] }) {
    return (
        <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-2">
            <Matrix title="Riesgo inherente" methodology={methodology} risks={risks} k="inherent" />
            <Matrix title="Riesgo residual" methodology={methodology} risks={risks} k="residual" />
        </div>
    );
}

function Matrix({ title, methodology, risks, k }: {
    title: string; methodology: Methodology; risks: Risk[]; k: "inherent" | "residual";
}) {
    const impacts = [3, 2, 1, 0];
    const probs = [1, 2, 3];
    const label = (scale: { value: number; label: string }[], v: number) => scale.find((s) => s.value === v)?.label ?? v;

    const cell = (p: number, i: number) => risks
        .filter((r) => r[k].probability === p && r[k].impact != null && Math.min(3, Math.round(r[k].impact as number)) === i)
        .map((r) => r.code);

    const counts = risks.reduce<Record<Level, number>>((acc, r) => {
        const l = r[k].level;
        if (l) acc[l] += 1;
        return acc;
    }, { Alto: 0, Medio: 0, Bajo: 0 });

    return (
        <section className="rounded-lg border border-line bg-surface p-4">
            <div className="mb-3 flex items-center justify-between">
                <h4 className="text-[0.9rem] font-semibold">{title}</h4>
                <p className="tnum text-[0.76rem] text-muted">
                    <span className="text-danger">{counts.Alto} altos</span> · <span className="text-warn">{counts.Medio} medios</span> · <span className="text-good">{counts.Bajo} bajos</span>
                </p>
            </div>
            <div className="flex">
                <div className="flex w-6 items-center justify-center">
                    <span className="-rotate-90 whitespace-nowrap text-[0.68rem] uppercase tracking-wide text-faint">Impacto</span>
                </div>
                <div className="flex-1">
                    {impacts.map((i) => (
                        <div key={i} className="flex">
                            <div className="flex w-16 items-center text-[0.72rem] text-muted">{i} · {label(methodology.impactScale, i)}</div>
                            {probs.map((p) => {
                                const codes = cell(p, i);
                                const lvl = levelFor(p * i);
                                return (
                                    <div key={p} className={`m-0.5 flex min-h-[64px] flex-1 flex-col rounded-md border p-1.5 ${levelBg[lvl]}`}>
                                        <span className="tnum text-[0.66rem] text-ink/60">{p * i}</span>
                                        <div className="mt-0.5 flex flex-wrap gap-1">
                                            {codes.map((c) => (
                                                <span key={c} className="tnum rounded bg-canvas/70 px-1 text-[0.68rem] font-semibold">{c}</span>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                    <div className="flex">
                        <div className="w-16" />
                        {probs.map((p) => (
                            <div key={p} className="flex-1 pt-1 text-center text-[0.72rem] text-muted">{p} · {label(methodology.probability, p)}</div>
                        ))}
                    </div>
                    <p className="mt-1 text-center text-[0.68rem] uppercase tracking-wide text-faint">Probabilidad</p>
                </div>
            </div>
        </section>
    );
}
