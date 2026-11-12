import { useState } from "react";
import { Plus, Lightbulb, Trash2 } from "lucide-react";

import Button from "../../components/ui/Button";
import { EmptyState } from "../../components/ui/States";
import type { Asset, Methodology, Opportunity } from "./types";
import { createOpportunity, updateOpportunity, deleteOpportunity } from "./services";
import EvaluationEditor from "./EvaluationEditor";
import { Modal, Field, Section, LevelBadge } from "./RiskUi";
import { input, errMsg } from "./riskHelpers";

// Hoja "Oportunidades": ISO 27001 cl. 6.1.1 pide atender riesgos y oportunidades.
export default function OpportunitiesTab({ assessmentId, methodology, assets, opportunities, onChanged }: {
    assessmentId: string; methodology: Methodology; assets: Asset[]; opportunities: Opportunity[]; onChanged: () => void;
}) {
    const [editing, setEditing] = useState<Opportunity | "new" | null>(null);

    return (
        <div className="mt-5">
            <div className="mb-3 flex items-center justify-between">
                <p className="text-[0.82rem] text-muted">Fortalezas que se pueden aprovechar para mejorar el SGSI o el servicio.</p>
                <Button size="sm" icon={<Plus size={14} />} onClick={() => setEditing("new")}>Nueva oportunidad</Button>
            </div>

            {opportunities.length === 0 ? (
                <EmptyState icon={<Lightbulb size={28} strokeWidth={1.5} />} title="Sin oportunidades registradas" />
            ) : (
                <div className="overflow-x-auto rounded-lg border border-line">
                    <table className="w-full text-left text-[0.83rem]">
                        <thead className="bg-surface text-[0.72rem] uppercase tracking-wide text-faint">
                            <tr>
                                <th className="px-3 py-2.5">ID</th>
                                <th className="px-3 py-2.5">Oportunidad</th>
                                <th className="px-3 py-2.5">Fortaleza</th>
                                <th className="px-3 py-2.5">Nivel</th>
                                <th className="px-3 py-2.5">Responsable</th>
                                <th className="px-3 py-2.5">Estado</th>
                            </tr>
                        </thead>
                        <tbody>
                            {opportunities.map((o) => (
                                <tr key={o._id} onClick={() => setEditing(o)} className="cursor-pointer border-t border-line hover:bg-surface-2/50">
                                    <td className="tnum whitespace-nowrap px-3 py-2.5 text-muted">{o.code}</td>
                                    <td className="max-w-[320px] px-3 py-2.5"><p className="line-clamp-2">{o.opportunity}</p></td>
                                    <td className="max-w-[240px] px-3 py-2.5 text-muted"><p className="line-clamp-2">{o.strength ?? "—"}</p></td>
                                    <td className="px-3 py-2.5"><LevelBadge level={o.level} score={o.score} /></td>
                                    <td className="px-3 py-2.5 text-muted">{o.owner ?? "—"}</td>
                                    <td className="px-3 py-2.5 text-muted">{o.status}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {editing && (
                <OpportunityModal
                    assessmentId={assessmentId}
                    methodology={methodology}
                    assets={assets}
                    opportunity={editing === "new" ? null : editing}
                    onClose={() => setEditing(null)}
                    onSaved={() => { setEditing(null); onChanged(); }}
                />
            )}
        </div>
    );
}

function OpportunityModal({ assessmentId, methodology, assets, opportunity, onClose, onSaved }: {
    assessmentId: string; methodology: Methodology; assets: Asset[]; opportunity: Opportunity | null;
    onClose: () => void; onSaved: () => void;
}) {
    const [f, setF] = useState<Partial<Opportunity>>(
        opportunity ?? { impacts: {}, status: "Pendiente", effectiveness: "No evaluado" }
    );
    const [saving, setSaving] = useState(false);
    const [err, setErr] = useState<string | null>(null);
    const set = (k: keyof Opportunity, v: unknown) => setF((p) => ({ ...p, [k]: v }));

    const save = async () => {
        if (!f.opportunity) { setErr("Describe la oportunidad"); return; }
        try {
            setSaving(true);
            const body = { ...f, asset: f.asset || null };
            if (opportunity) await updateOpportunity(opportunity._id, body);
            else await createOpportunity(assessmentId, body);
            onSaved();
        } catch (e) {
            setErr(errMsg(e, "Error al guardar"));
        } finally {
            setSaving(false);
        }
    };

    const remove = async () => {
        if (!opportunity || !confirm(`¿Eliminar ${opportunity.code}?`)) return;
        try {
            await deleteOpportunity(opportunity._id);
            onSaved();
        } catch (e) {
            setErr(errMsg(e, "Error al eliminar"));
        }
    };

    return (
        <Modal
            wide
            title={opportunity ? `Oportunidad ${opportunity.code}` : "Nueva oportunidad"}
            onClose={onClose}
            footer={<>
                {err && <p className="mr-auto self-center text-[0.8rem] text-danger">{err}</p>}
                {opportunity && <Button variant="danger" size="sm" icon={<Trash2 size={14} />} onClick={remove}>Eliminar</Button>}
                <Button variant="ghost" size="sm" onClick={onClose}>Cancelar</Button>
                <Button size="sm" disabled={saving} onClick={save}>{saving ? "Guardando..." : "Guardar"}</Button>
            </>}
        >
            <div className="space-y-4">
                <Section title="Identificación">
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                        <Field label="Activo / servicio (opcional)">
                            <select className={input} value={f.asset ?? ""} onChange={(e) => set("asset", e.target.value)}>
                                <option value="">—</option>
                                {assets.map((a) => <option key={a._id} value={a._id}>{a.code} · {a.name}</option>)}
                            </select>
                        </Field>
                        <Field label="Fortaleza">
                            <input className={input} value={f.strength ?? ""} onChange={(e) => set("strength", e.target.value)} />
                        </Field>
                        <Field label="Oportunidad" className="md:col-span-2">
                            <input className={input} value={f.opportunity ?? ""} onChange={(e) => set("opportunity", e.target.value)} />
                        </Field>
                        <Field label="Escenario del aprovechamiento" className="md:col-span-2">
                            <textarea className={`${input} min-h-[60px]`} value={f.scenario ?? ""} onChange={(e) => set("scenario", e.target.value)} />
                        </Field>
                    </div>
                </Section>
                <Section title="Impacto positivo">
                    <EvaluationEditor
                        positive
                        methodology={methodology}
                        dimensions={methodology.opportunityImpactDimensions}
                        probability={f.probability}
                        impacts={f.impacts ?? {}}
                        onChange={(v) => setF((p) => ({ ...p, probability: v.probability, impacts: v.impacts }))}
                    />
                </Section>
                <Section title="Aprovechamiento">
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                        <Field label="Acciones posibles" className="md:col-span-3">
                            <textarea className={`${input} min-h-[50px]`} value={f.possibleActions ?? ""} onChange={(e) => set("possibleActions", e.target.value)} />
                        </Field>
                        <Field label="Acción tomada" className="md:col-span-3">
                            <input className={input} value={f.actionTaken ?? ""} onChange={(e) => set("actionTaken", e.target.value)} />
                        </Field>
                        <Field label="Responsable">
                            <input className={input} value={f.owner ?? ""} onChange={(e) => set("owner", e.target.value)} />
                        </Field>
                        <Field label="Estado">
                            <select className={input} value={f.status} onChange={(e) => set("status", e.target.value)}>
                                {methodology.treatmentStatus.map((s) => <option key={s}>{s}</option>)}
                            </select>
                        </Field>
                        <Field label="Eficacia">
                            <select className={input} value={f.effectiveness} onChange={(e) => set("effectiveness", e.target.value)}>
                                {methodology.effectiveness.map((s) => <option key={s}>{s}</option>)}
                            </select>
                        </Field>
                    </div>
                </Section>
            </div>
        </Modal>
    );
}
