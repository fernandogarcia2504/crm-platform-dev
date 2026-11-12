import { useCallback, useEffect, useState } from "react";
import { Download, Pencil } from "lucide-react";

import Button from "../../components/ui/Button";
import Badge from "../../components/ui/Badge";
import { Spinner, ErrorText } from "../../components/ui/States";
import type { Assessment, SoaOverride, SoaRow } from "./types";
import { getSoA, updateAssessment } from "./services";
import { Modal, Field } from "./RiskUi";
import { input, errMsg } from "./riskHelpers";

const implTone = { "Implementado": "good", "En proceso": "info", "Pendiente": "warn", "No aplica": "neutral" } as const;

type View = "Todos" | "Aplicables" | "No aplicables";

// Declaración de Aplicabilidad: se genera de los tratamientos de los riesgos
// y se ajusta a mano (soaOverrides) para requisitos sin riesgo asociado.
export default function SoaTab({ assessment, refreshKey, onChanged }: {
    assessment: Assessment; refreshKey: number; onChanged: () => void;
}) {
    const [rows, setRows] = useState<SoaRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [view, setView] = useState<View>("Todos");
    const [q, setQ] = useState("");
    const [editing, setEditing] = useState<SoaRow | null>(null);

    const load = useCallback(async () => {
        try {
            const soa = await getSoA(assessment._id);
            setRows(soa);
            setError(null);
        } catch (e) {
            setError(errMsg(e, "Error al generar la SoA"));
        } finally {
            setLoading(false);
        }
    }, [assessment._id]);

    useEffect(() => { load(); }, [load, refreshKey]);

    const shown = rows.filter((r) =>
        (view === "Todos" || (view === "Aplicables" ? r.applicable : !r.applicable))
        && `${r.code} ${r.name}`.toLowerCase().includes(q.toLowerCase())
    );

    const applicable = rows.filter((r) => r.applicable).length;
    const implemented = rows.filter((r) => r.implementation === "Implementado").length;

    const exportCsv = () => {
        const esc = (s: string) => `"${String(s).replace(/"/g, '""')}"`;
        const lines = [
            ["Control", "Tema", "Nombre", "Aplica", "Justificación", "Riesgos relacionados", "Implementación"].map(esc).join(","),
            ...rows.map((r) => [r.code, r.theme, r.name, r.applicable ? "Sí" : "No", r.justification, r.relatedRisks.join(" "), r.implementation].map(esc).join(","))
        ];
        const blob = new Blob(["﻿" + lines.join("\n")], { type: "text/csv;charset=utf-8" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `SoA - ${assessment.companyName} - ${assessment.name}.csv`;
        a.click();
        URL.revokeObjectURL(a.href);
    };

    return (
        <div className="mt-5">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className="flex gap-1">
                        {(["Todos", "Aplicables", "No aplicables"] as View[]).map((v) => (
                            <button
                                key={v}
                                onClick={() => setView(v)}
                                className={["whitespace-nowrap rounded-md px-2.5 py-1 text-[0.78rem] font-medium", view === v ? "bg-surface-2 text-ink" : "text-muted hover:text-ink"].join(" ")}
                            >
                                {v}
                            </button>
                        ))}
                    </div>
                    <input className={`${input} w-[220px] py-1.5`} placeholder="Buscar control..." value={q} onChange={(e) => setQ(e.target.value)} />
                </div>
                <div className="flex items-center gap-3">
                    <span className="tnum text-[0.78rem] text-muted">{applicable} de 93 aplicables · {implemented} implementados</span>
                    <Button size="sm" variant="secondary" icon={<Download size={14} />} onClick={exportCsv} disabled={!rows.length}>Exportar CSV</Button>
                </div>
            </div>

            {loading && <Spinner label="Generando Declaración de Aplicabilidad..." />}
            {error && <ErrorText>{error}</ErrorText>}

            {!loading && !error && (
                <div className="overflow-x-auto rounded-lg border border-line">
                    <table className="w-full text-left text-[0.82rem]">
                        <thead className="bg-surface text-[0.72rem] uppercase tracking-wide text-faint">
                            <tr>
                                <th className="px-3 py-2.5">Control</th>
                                <th className="px-3 py-2.5">Nombre</th>
                                <th className="px-3 py-2.5">Aplica</th>
                                <th className="px-3 py-2.5">Justificación</th>
                                <th className="px-3 py-2.5">Riesgos</th>
                                <th className="px-3 py-2.5">Implementación</th>
                                <th className="px-3 py-2.5" />
                            </tr>
                        </thead>
                        <tbody>
                            {shown.map((r) => (
                                <tr key={r.code} className="border-t border-line align-top">
                                    <td className="tnum whitespace-nowrap px-3 py-2 text-muted">{r.code}</td>
                                    <td className="px-3 py-2">
                                        {r.name}
                                        {r.newIn2022 && <span className="ml-1.5 rounded bg-purple/14 px-1 text-[0.62rem] font-semibold text-purple">2022</span>}
                                        <p className="text-[0.7rem] text-faint">{r.theme}</p>
                                    </td>
                                    <td className="px-3 py-2">{r.applicable ? "Sí" : <span className="text-faint">No</span>}</td>
                                    <td className="max-w-[280px] px-3 py-2 text-muted">
                                        {r.justification}
                                        {r.overridden && <span className="ml-1 text-[0.68rem] text-accent">(manual)</span>}
                                    </td>
                                    <td className="tnum px-3 py-2 text-muted">{r.relatedRisks.join(", ") || "—"}</td>
                                    <td className="px-3 py-2"><Badge tone={implTone[r.implementation as keyof typeof implTone] ?? "neutral"}>{r.implementation}</Badge></td>
                                    <td className="px-3 py-2 text-right">
                                        <button onClick={() => setEditing(r)} aria-label="Editar" className="rounded p-1 text-faint hover:bg-surface-2 hover:text-ink">
                                            <Pencil size={14} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {editing && (
                <OverrideModal
                    row={editing}
                    current={assessment.soaOverrides?.[editing.code]}
                    onClose={() => setEditing(null)}
                    onSave={async (ov) => {
                        const next = { ...(assessment.soaOverrides ?? {}) };
                        if (ov) next[editing.code] = ov; else delete next[editing.code];
                        await updateAssessment(assessment._id, { soaOverrides: next });
                        setEditing(null);
                        onChanged();
                    }}
                />
            )}
        </div>
    );
}

function OverrideModal({ row, current, onClose, onSave }: {
    row: SoaRow; current?: SoaOverride; onClose: () => void; onSave: (ov: SoaOverride | null) => Promise<void>;
}) {
    const [applicable, setApplicable] = useState(current?.applicable === undefined ? "auto" : current.applicable ? "si" : "no");
    const [justification, setJustification] = useState(current?.justification ?? "");
    const [implementation, setImplementation] = useState(current?.implementation ?? "");
    const [err, setErr] = useState<string | null>(null);

    const save = async () => {
        const ov: SoaOverride = {};
        if (applicable !== "auto") ov.applicable = applicable === "si";
        if (justification) ov.justification = justification;
        if (implementation) ov.implementation = implementation;
        try {
            await onSave(Object.keys(ov).length ? ov : null);
        } catch (e) {
            setErr(errMsg(e, "Error al guardar"));
        }
    };

    return (
        <Modal
            title={`${row.code} ${row.name}`}
            onClose={onClose}
            footer={<>
                {err && <p className="mr-auto self-center text-[0.8rem] text-danger">{err}</p>}
                <Button variant="ghost" size="sm" onClick={onClose}>Cancelar</Button>
                <Button size="sm" onClick={save}>Guardar</Button>
            </>}
        >
            <div className="space-y-3">
                <Field label="¿Aplica?" hint="Automático = aplica si algún tratamiento usa este control.">
                    <select className={input} value={applicable} onChange={(e) => setApplicable(e.target.value)}>
                        <option value="auto">Automático</option>
                        <option value="si">Sí</option>
                        <option value="no">No</option>
                    </select>
                </Field>
                <Field label="Justificación" hint="Obligatoria para exclusiones en la SoA (ISO 27001 cl. 6.1.3 d).">
                    <textarea className={`${input} min-h-[70px]`} value={justification} onChange={(e) => setJustification(e.target.value)} placeholder={row.justification} />
                </Field>
                <Field label="Implementación">
                    <select className={input} value={implementation} onChange={(e) => setImplementation(e.target.value)}>
                        <option value="">Automática (según tratamientos)</option>
                        <option>Implementado</option>
                        <option>En proceso</option>
                        <option>Pendiente</option>
                        <option>No aplica</option>
                    </select>
                </Field>
            </div>
        </Modal>
    );
}
