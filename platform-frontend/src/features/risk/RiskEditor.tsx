import { useMemo, useState } from "react";
import { Plus, Trash2, Sparkles, Copy } from "lucide-react";

import Button from "../../components/ui/Button";
import type { Asset, Catalogs, Risk, Treatment, Evaluation, Methodology } from "./types";
import { createRisk, updateRisk, deleteRisk } from "./services";
import { evaluate } from "./scoring";
import EvaluationEditor from "./EvaluationEditor";
import { Modal, Field, Section, LevelBadge } from "./RiskUi";
import { input, errMsg } from "./riskHelpers";

const LEVEL_RANK = { Bajo: 1, Medio: 2, Alto: 3 } as const;

// Tipos de activo que coinciden con los grupos del catálogo de vulnerabilidades
const VULN_GROUPS = ["Hardware", "Software", "Red", "Personal", "Sitio / instalaciones", "Organización"];

const emptyEval = (): Evaluation => ({ probability: undefined, impacts: {} });

const newTreatment = (controlCode = ""): Treatment => ({
    controlCode, status: "Pendiente", effectiveness: "No evaluado"
});

type Draft = Omit<Risk, "_id" | "assessment" | "code"> & { code?: string };

export default function RiskEditor({
    assessmentId, methodology, acceptanceLevel, catalogs, assets, risk, onClose, onSaved
}: {
    assessmentId: string;
    methodology: Methodology;
    acceptanceLevel: keyof typeof LEVEL_RANK;
    catalogs: Catalogs;
    assets: Asset[];
    risk: Risk | null;
    onClose: () => void;
    onSaved: () => void;
}) {
    const [d, setD] = useState<Draft>(() => risk
        ? JSON.parse(JSON.stringify(risk))
        : {
            asset: assets[0]?._id ?? "",
            scenario: "",
            inherent: emptyEval(),
            residual: emptyEval(),
            treatments: [],
            residualAccepted: false
        });
    const [allVulns, setAllVulns] = useState(false);
    const [saving, setSaving] = useState(false);
    const [err, setErr] = useState<string | null>(null);

    const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((prev) => ({ ...prev, [k]: v }));

    const asset = assets.find((a) => a._id === d.asset);
    const vulnGroup = asset && VULN_GROUPS.includes(asset.type) ? asset.type : null;
    const vulnOptions = catalogs.vulnerabilities.filter((v) => allVulns || !vulnGroup || v.assetType === vulnGroup);
    const vuln = catalogs.vulnerabilities.find((v) => v.code === d.vulnerabilityCode);
    const controlsByCode = useMemo(
        () => Object.fromEntries(catalogs.controls.map((c) => [c.code, c])),
        [catalogs.controls]
    );

    const threatGroups = useMemo(() => catalogs.threats.reduce<Record<string, typeof catalogs.threats>>((acc, t) => {
        (acc[t.group] = acc[t.group] || []).push(t);
        return acc;
    }, {}), [catalogs]);

    const controlGroups = useMemo(() => catalogs.controls.reduce<Record<string, typeof catalogs.controls>>((acc, c) => {
        (acc[c.themeName] = acc[c.themeName] || []).push(c);
        return acc;
    }, {}), [catalogs]);

    const inh = evaluate(d.inherent.probability, d.inherent.impacts, methodology);
    const res = evaluate(d.residual.probability, d.residual.impacts, methodology);
    const effective = res.level ?? inh.level;
    const withinAppetite = effective ? LEVEL_RANK[effective] <= LEVEL_RANK[acceptanceLevel] : null;

    const usedControls = new Set(d.treatments.map((t) => t.controlCode));
    const suggested = (vuln?.suggestedControls ?? []).filter((c) => !usedControls.has(c));

    const setTreatment = (i: number, patch: Partial<Treatment>) =>
        set("treatments", d.treatments.map((t, idx) => (idx === i ? { ...t, ...patch } : t)));

    const save = async () => {
        if (!d.asset) { setErr("Selecciona un activo"); return; }
        if (!d.scenario.trim()) { setErr("Describe el escenario del riesgo"); return; }
        try {
            setSaving(true);
            setErr(null);
            const body: Partial<Risk> = {
                ...d,
                acceptedAt: d.residualAccepted ? (d.acceptedAt ?? new Date().toISOString()) : undefined
            };
            if (risk) await updateRisk(risk._id, body);
            else await createRisk(assessmentId, body);
            onSaved();
        } catch (e) {
            setErr(errMsg(e, "Error al guardar el riesgo"));
        } finally {
            setSaving(false);
        }
    };

    const remove = async () => {
        if (!risk || !confirm(`¿Eliminar el riesgo ${risk.code}?`)) return;
        try {
            await deleteRisk(risk._id);
            onSaved();
        } catch (e) {
            setErr(errMsg(e, "Error al eliminar"));
        }
    };

    return (
        <Modal
            wide
            title={risk ? `Riesgo ${risk.code}` : "Nuevo riesgo"}
            onClose={onClose}
            footer={<>
                {err && <p className="mr-auto self-center text-[0.8rem] text-danger">{err}</p>}
                {risk && <Button variant="danger" size="sm" icon={<Trash2 size={14} />} onClick={remove}>Eliminar</Button>}
                <Button variant="ghost" size="sm" onClick={onClose}>Cancelar</Button>
                <Button size="sm" disabled={saving} onClick={save}>{saving ? "Guardando..." : "Guardar"}</Button>
            </>}
        >
            <div className="space-y-4">
                {/* 1. Identificación */}
                <Section title="1. Identificación" subtitle="Activo, fuente, amenaza y vulnerabilidad que forman el escenario (ISO 27005).">
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                        <Field label="Activo">
                            <select className={input} value={d.asset} onChange={(e) => set("asset", e.target.value)}>
                                {assets.map((a) => <option key={a._id} value={a._id}>{a.code} · {a.name} ({a.type})</option>)}
                            </select>
                        </Field>
                        <Field label="Dueño del riesgo" hint="Quien aprueba el tratamiento y acepta el residual.">
                            <input className={input} value={d.riskOwner ?? ""} onChange={(e) => set("riskOwner", e.target.value)} />
                        </Field>
                        <Field label="Fuente de riesgo">
                            <select className={input} value={d.riskSourceCode ?? ""} onChange={(e) => set("riskSourceCode", e.target.value)}>
                                <option value="">—</option>
                                {catalogs.riskSources.map((s) => <option key={s.code} value={s.code} title={s.description}>{s.name} · {s.type}</option>)}
                            </select>
                        </Field>
                        <Field label="Objetivo de la fuente (estado final deseado)">
                            <select className={input} value={d.desiredEndStateCode ?? ""} onChange={(e) => set("desiredEndStateCode", e.target.value)}>
                                <option value="">—</option>
                                {catalogs.desiredEndStates.map((s) => <option key={s.code} value={s.code} title={s.description}>{s.name}</option>)}
                            </select>
                        </Field>
                        <Field label="Amenaza">
                            <select className={input} value={d.threatCode ?? ""} onChange={(e) => set("threatCode", e.target.value)}>
                                <option value="">— Otra (texto libre) —</option>
                                {Object.entries(threatGroups).map(([g, list]) => (
                                    <optgroup key={g} label={g}>
                                        {list.map((t) => <option key={t.code} value={t.code}>{t.name} [{t.affects.join("")}]</option>)}
                                    </optgroup>
                                ))}
                            </select>
                        </Field>
                        <Field label="Detalle de la amenaza">
                            <input className={input} value={d.threatText ?? ""} onChange={(e) => set("threatText", e.target.value)} placeholder="Opcional" />
                        </Field>
                        <Field
                            label="Vulnerabilidad"
                            hint={vulnGroup && !allVulns ? `Filtrado por tipo de activo: ${vulnGroup}.` : undefined}
                        >
                            <select className={input} value={d.vulnerabilityCode ?? ""} onChange={(e) => set("vulnerabilityCode", e.target.value)}>
                                <option value="">— Otra (texto libre) —</option>
                                {vulnOptions.map((v) => <option key={v.code} value={v.code}>{allVulns || !vulnGroup ? `${v.assetType} · ` : ""}{v.name}</option>)}
                            </select>
                            {vulnGroup && (
                                <button type="button" className="mt-1 text-[0.7rem] text-accent hover:underline" onClick={() => setAllVulns((x) => !x)}>
                                    {allVulns ? "Filtrar por tipo de activo" : "Ver todas las vulnerabilidades"}
                                </button>
                            )}
                        </Field>
                        <Field label="Detalle de la vulnerabilidad">
                            <input className={input} value={d.vulnerabilityText ?? ""} onChange={(e) => set("vulnerabilityText", e.target.value)} placeholder="Hallazgo concreto, versión, evidencia" />
                        </Field>
                        <Field label="Escenario del riesgo" className="md:col-span-2">
                            <textarea
                                className={`${input} min-h-[70px]`}
                                value={d.scenario}
                                onChange={(e) => set("scenario", e.target.value)}
                                placeholder="Un atacante oportunista explota... en el activo... provocando..."
                            />
                        </Field>
                    </div>
                </Section>

                {/* 2. Inherente */}
                <Section title="2. Riesgo inherente" subtitle="Antes de aplicar nuevos controles.">
                    <EvaluationEditor
                        methodology={methodology}
                        dimensions={methodology.riskImpactDimensions}
                        probability={d.inherent.probability}
                        impacts={d.inherent.impacts}
                        onChange={(v) => set("inherent", { ...d.inherent, ...v })}
                    />
                </Section>

                {/* 3. Tratamiento */}
                <Section
                    title="3. Tratamiento"
                    subtitle="Controles del Anexo A de ISO 27001:2022 que se aplican al riesgo."
                    actions={<Button size="sm" variant="secondary" icon={<Plus size={14} />} onClick={() => set("treatments", [...d.treatments, newTreatment()])}>Agregar acción</Button>}
                >
                    <div className="mb-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                        <Field label="Opción de tratamiento">
                            <select className={input} value={d.treatmentOption ?? ""} onChange={(e) => set("treatmentOption", e.target.value || undefined)}>
                                <option value="">—</option>
                                {methodology.treatmentOptions.map((o) => <option key={o}>{o}</option>)}
                            </select>
                        </Field>
                    </div>

                    {suggested.length > 0 && (
                        <div className="mb-3 flex flex-wrap items-center gap-1.5">
                            <span className="flex items-center gap-1 text-[0.74rem] text-muted"><Sparkles size={13} /> Sugeridos para esta vulnerabilidad:</span>
                            {suggested.map((c) => (
                                <button
                                    key={c}
                                    type="button"
                                    onClick={() => set("treatments", [...d.treatments, newTreatment(c)])}
                                    className="rounded-md border border-accent/40 bg-accent/10 px-2 py-0.5 text-[0.74rem] text-ink hover:bg-accent/20"
                                    title={controlsByCode[c]?.name}
                                >
                                    + {c} {controlsByCode[c]?.name}
                                </button>
                            ))}
                        </div>
                    )}

                    {d.treatments.length === 0 && <p className="text-[0.8rem] text-faint">Sin acciones de tratamiento.</p>}

                    <div className="space-y-3">
                        {d.treatments.map((t, i) => (
                            <div key={t._id ?? `new-${i}`} className="rounded-md border border-line-2 bg-surface-2/40 p-3">
                                <div className="grid grid-cols-1 gap-2.5 md:grid-cols-3">
                                    <Field label="Control del Anexo A" className="md:col-span-2">
                                        <select className={input} value={t.controlCode ?? ""} onChange={(e) => setTreatment(i, { controlCode: e.target.value })}>
                                            <option value="">— Sin control —</option>
                                            {Object.entries(controlGroups).map(([g, list]) => (
                                                <optgroup key={g} label={`Controles ${g.toLowerCase()}`}>
                                                    {list.map((c) => <option key={c.code} value={c.code}>{c.code} {c.name}</option>)}
                                                </optgroup>
                                            ))}
                                        </select>
                                    </Field>
                                    <Field label="Estado">
                                        <select className={input} value={t.status} onChange={(e) => setTreatment(i, { status: e.target.value })}>
                                            {methodology.treatmentStatus.map((s) => <option key={s}>{s}</option>)}
                                        </select>
                                    </Field>
                                    <Field label="Control secundario / detalle" className="md:col-span-3">
                                        <input className={input} value={t.controlDetail ?? ""} onChange={(e) => setTreatment(i, { controlDetail: e.target.value })} />
                                    </Field>
                                    <Field label="Descripción completa del tratamiento" className="md:col-span-3">
                                        <textarea className={`${input} min-h-[56px]`} value={t.description ?? ""} onChange={(e) => setTreatment(i, { description: e.target.value })} />
                                    </Field>
                                    <Field label="Responsable">
                                        <input className={input} value={t.owner ?? ""} onChange={(e) => setTreatment(i, { owner: e.target.value })} />
                                    </Field>
                                    <Field label="Fecha compromiso">
                                        <input type="date" className={input} value={t.dueDate?.slice(0, 10) ?? ""} onChange={(e) => setTreatment(i, { dueDate: e.target.value || undefined })} />
                                    </Field>
                                    <Field label="Periodicidad de monitoreo">
                                        <select className={input} value={t.monitoringFrequency ?? ""} onChange={(e) => setTreatment(i, { monitoringFrequency: e.target.value || undefined })}>
                                            <option value="">—</option>
                                            {methodology.monitoringFrequency.map((s) => <option key={s}>{s}</option>)}
                                        </select>
                                    </Field>
                                    <Field label="Eficacia">
                                        <select className={input} value={t.effectiveness} onChange={(e) => setTreatment(i, { effectiveness: e.target.value })}>
                                            {methodology.effectiveness.map((s) => <option key={s}>{s}</option>)}
                                        </select>
                                    </Field>
                                    <Field label="Fecha de evaluación de eficacia">
                                        <input type="date" className={input} value={t.effectivenessDate?.slice(0, 10) ?? ""} onChange={(e) => setTreatment(i, { effectivenessDate: e.target.value || undefined })} />
                                    </Field>
                                    <Field label="Evidencia">
                                        <input className={input} value={t.evidence ?? ""} onChange={(e) => setTreatment(i, { evidence: e.target.value })} placeholder="Liga o referencia" />
                                    </Field>
                                </div>
                                <div className="mt-2 flex justify-end">
                                    <Button variant="ghost" size="sm" icon={<Trash2 size={13} />} onClick={() => set("treatments", d.treatments.filter((_, idx) => idx !== i))}>
                                        Quitar
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </Section>

                {/* 4. Residual */}
                <Section
                    title="4. Riesgo residual"
                    subtitle="Reevaluación después de los tratamientos."
                    actions={<Button size="sm" variant="ghost" icon={<Copy size={13} />} onClick={() => set("residual", JSON.parse(JSON.stringify(d.inherent)))}>Copiar inherente</Button>}
                >
                    <EvaluationEditor
                        methodology={methodology}
                        dimensions={methodology.riskImpactDimensions}
                        probability={d.residual.probability}
                        impacts={d.residual.impacts}
                        onChange={(v) => set("residual", { ...d.residual, ...v })}
                    />
                </Section>

                {/* 5. Aceptación */}
                <Section title="5. Aceptación del riesgo residual" subtitle={`Apetito de la evaluación: hasta ${acceptanceLevel}.`}>
                    <div className="flex flex-wrap items-center gap-4">
                        <div className="flex items-center gap-2 text-[0.82rem]">
                            Nivel vigente: <LevelBadge level={effective} score={res.score ?? inh.score} />
                            {withinAppetite !== null && (
                                <span className={withinAppetite ? "text-good" : "text-warn"}>
                                    {withinAppetite ? "Dentro del apetito" : "Fuera del apetito"}
                                </span>
                            )}
                        </div>
                        <label className="flex items-center gap-2 text-[0.84rem]">
                            <input
                                type="checkbox"
                                className="accent-[var(--color-accent)]"
                                checked={d.residualAccepted}
                                onChange={(e) => set("residualAccepted", e.target.checked)}
                            />
                            Se acepta el riesgo residual
                        </label>
                        {d.residualAccepted && (
                            <input className={`${input} max-w-[260px]`} placeholder="Aceptado por" value={d.acceptedBy ?? ""} onChange={(e) => set("acceptedBy", e.target.value)} />
                        )}
                    </div>
                    <Field label="Observaciones" className="mt-3">
                        <textarea className={`${input} min-h-[50px]`} value={d.notes ?? ""} onChange={(e) => set("notes", e.target.value)} />
                    </Field>
                </Section>
            </div>
        </Modal>
    );
}
