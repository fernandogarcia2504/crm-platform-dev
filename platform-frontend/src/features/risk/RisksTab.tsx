import { useState } from "react";
import { Plus, ShieldAlert, Check } from "lucide-react";

import Button from "../../components/ui/Button";
import { EmptyState } from "../../components/ui/States";
import type { Asset, Catalogs, Level, Methodology, Risk } from "./types";
import RiskEditor from "./RiskEditor";
import { LevelBadge } from "./RiskUi";

type Filter = "Todos" | Level | "Fuera de apetito";

export default function RisksTab({ assessmentId, methodology, acceptanceLevel, catalogs, assets, risks, onChanged }: {
    assessmentId: string;
    methodology: Methodology;
    acceptanceLevel: Level;
    catalogs: Catalogs;
    assets: Asset[];
    risks: Risk[];
    onChanged: () => void;
}) {
    const [editing, setEditing] = useState<Risk | "new" | null>(null);
    const [filter, setFilter] = useState<Filter>("Todos");

    const assetName = (id: string) => assets.find((a) => a._id === id)?.name ?? "—";
    const threatName = (r: Risk) =>
        catalogs.threats.find((t) => t.code === r.threatCode)?.name ?? r.threatText ?? "—";

    const shown = risks.filter((r) => {
        if (filter === "Todos") return true;
        if (filter === "Fuera de apetito") return r.withinAppetite === false;
        return r.inherent.level === filter;
    });

    const newBtn = (
        <Button size="sm" icon={<Plus size={14} />} disabled={assets.length === 0} onClick={() => setEditing("new")}>
            Nuevo riesgo
        </Button>
    );

    return (
        <div className="mt-5">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <div className="flex gap-1">
                    {(["Todos", "Alto", "Medio", "Bajo", "Fuera de apetito"] as Filter[]).map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={[
                                "whitespace-nowrap rounded-md px-2.5 py-1 text-[0.78rem] font-medium transition-colors",
                                filter === f ? "bg-surface-2 text-ink" : "text-muted hover:text-ink"
                            ].join(" ")}
                        >
                            {f}
                        </button>
                    ))}
                </div>
                {newBtn}
            </div>

            {risks.length === 0 ? (
                <EmptyState
                    icon={<ShieldAlert size={28} strokeWidth={1.5} />}
                    title="Sin riesgos identificados"
                    hint={assets.length === 0 ? "Primero registra activos en la pestaña Activos." : "Identifica el primer escenario de riesgo."}
                    action={newBtn}
                />
            ) : (
                <div className="overflow-x-auto rounded-lg border border-line">
                    <table className="w-full text-left text-[0.83rem]">
                        <thead className="bg-surface text-[0.72rem] uppercase tracking-wide text-faint">
                            <tr>
                                <th className="px-3 py-2.5">ID</th>
                                <th className="px-3 py-2.5">Escenario</th>
                                <th className="px-3 py-2.5">Activo</th>
                                <th className="px-3 py-2.5">Amenaza</th>
                                <th className="px-3 py-2.5">Inherente</th>
                                <th className="px-3 py-2.5">Tratamiento</th>
                                <th className="px-3 py-2.5">Residual</th>
                                <th className="px-3 py-2.5">Aceptado</th>
                            </tr>
                        </thead>
                        <tbody>
                            {shown.map((r) => {
                                const done = r.treatments.filter((t) => t.status === "Implementado").length;
                                const total = r.treatments.filter((t) => t.status !== "Cancelado").length;
                                return (
                                    <tr key={r._id} onClick={() => setEditing(r)} className="cursor-pointer border-t border-line align-top hover:bg-surface-2/50">
                                        <td className="tnum whitespace-nowrap px-3 py-2.5 text-muted">{r.code}</td>
                                        <td className="max-w-[320px] px-3 py-2.5"><p className="line-clamp-2">{r.scenario}</p></td>
                                        <td className="px-3 py-2.5 text-muted">{assetName(r.asset)}</td>
                                        <td className="max-w-[200px] px-3 py-2.5 text-muted"><p className="line-clamp-2">{threatName(r)}</p></td>
                                        <td className="px-3 py-2.5"><LevelBadge level={r.inherent.level} score={r.inherent.score} /></td>
                                        <td className="px-3 py-2.5">
                                            <p>{r.treatmentOption ?? "—"}</p>
                                            {total > 0 && <p className="tnum text-[0.72rem] text-faint">{done}/{total} implementados</p>}
                                        </td>
                                        <td className="px-3 py-2.5">
                                            <LevelBadge level={r.residual.level} score={r.residual.score} />
                                            {r.withinAppetite === false && <p className="mt-0.5 text-[0.7rem] text-warn">Fuera de apetito</p>}
                                        </td>
                                        <td className="px-3 py-2.5">{r.residualAccepted ? <Check size={16} className="text-good" /> : <span className="text-faint">—</span>}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {editing && (
                <RiskEditor
                    assessmentId={assessmentId}
                    methodology={methodology}
                    acceptanceLevel={acceptanceLevel}
                    catalogs={catalogs}
                    assets={assets}
                    risk={editing === "new" ? null : editing}
                    onClose={() => setEditing(null)}
                    onSaved={() => { setEditing(null); onChanged(); }}
                />
            )}
        </div>
    );
}
