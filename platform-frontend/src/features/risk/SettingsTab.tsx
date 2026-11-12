import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Save, Trash2 } from "lucide-react";

import Button from "../../components/ui/Button";
import type { Assessment, Methodology } from "./types";
import { updateAssessment, deleteAssessment } from "./services";
import { Field, Section } from "./RiskUi";
import { input, errMsg } from "./riskHelpers";

// Datos de la evaluación + criterios de la metodología (referencia para el consultor).
export default function SettingsTab({ assessment, methodology, onChanged }: {
    assessment: Assessment; methodology: Methodology; onChanged: () => void;
}) {
    const navigate = useNavigate();
    const [f, setF] = useState({
        name: assessment.name,
        status: assessment.status,
        scope: assessment.scope ?? "",
        context: assessment.context ?? "",
        acceptanceLevel: assessment.acceptanceLevel,
        method: methodology.impactAggregation.method,
        reviewFrequency: assessment.reviewFrequency ?? "Anual",
        nextReviewDate: assessment.nextReviewDate?.slice(0, 10) ?? "",
        notes: assessment.notes ?? ""
    });
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
    const set = (k: keyof typeof f, v: string) => setF((p) => ({ ...p, [k]: v }));

    const save = async () => {
        try {
            setSaving(true);
            setMsg(null);
            const { method, ...rest } = f;
            await updateAssessment(assessment._id, {
                ...rest,
                nextReviewDate: rest.nextReviewDate || null,
                methodology: method !== methodology.impactAggregation.method ? { impactAggregation: { method } } : undefined
            });
            setMsg({ ok: true, text: "Evaluación guardada. Los niveles se recalcularon." });
            onChanged();
        } catch (e) {
            setMsg({ ok: false, text: errMsg(e, "Error al guardar") });
        } finally {
            setSaving(false);
        }
    };

    const remove = async () => {
        if (!confirm(`¿Eliminar la evaluación "${assessment.name}" con todos sus activos, riesgos y oportunidades?`)) return;
        try {
            await deleteAssessment(assessment._id);
            navigate("/riesgos");
        } catch (e) {
            setMsg({ ok: false, text: errMsg(e, "Error al eliminar") });
        }
    };

    return (
        <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-[1.2fr_1fr]">
            <Section
                title="Datos de la evaluación"
                actions={<Button size="sm" icon={<Save size={14} />} disabled={saving} onClick={save}>{saving ? "Guardando..." : "Guardar"}</Button>}
            >
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <Field label="Nombre" className="md:col-span-2">
                        <input className={input} value={f.name} onChange={(e) => set("name", e.target.value)} />
                    </Field>
                    <Field label="Estado">
                        <select className={input} value={f.status} onChange={(e) => set("status", e.target.value)}>
                            {["Planeada", "En curso", "Tratamiento", "Completada"].map((s) => <option key={s}>{s}</option>)}
                        </select>
                    </Field>
                    <Field label="Nivel aceptable (apetito)">
                        <select className={input} value={f.acceptanceLevel} onChange={(e) => set("acceptanceLevel", e.target.value)}>
                            <option>Bajo</option><option>Medio</option><option>Alto</option>
                        </select>
                    </Field>
                    <Field label="Cálculo del impacto total" hint={methodology.impactAggregation.note}>
                        <select className={input} value={f.method} onChange={(e) => set("method", e.target.value)}>
                            <option value="max">Máximo (recomendado)</option>
                            <option value="avg">Promedio</option>
                            <option value="maxAvg">Promedio entre máximo y promedio</option>
                        </select>
                    </Field>
                    <Field label="Revisión periódica">
                        <select className={input} value={f.reviewFrequency} onChange={(e) => set("reviewFrequency", e.target.value)}>
                            {methodology.monitoringFrequency.map((s) => <option key={s}>{s}</option>)}
                        </select>
                    </Field>
                    <Field label="Próxima revisión">
                        <input type="date" className={input} value={f.nextReviewDate} onChange={(e) => set("nextReviewDate", e.target.value)} />
                    </Field>
                    <Field label="Alcance" className="md:col-span-2" hint="ISO 27001 cl. 4.3">
                        <textarea className={`${input} min-h-[70px]`} value={f.scope} onChange={(e) => set("scope", e.target.value)} />
                    </Field>
                    <Field label="Contexto y requisitos" className="md:col-span-2" hint="Cuestiones internas/externas y regulación aplicable (CNBV, Banxico, LFPDPPP...).">
                        <textarea className={`${input} min-h-[70px]`} value={f.context} onChange={(e) => set("context", e.target.value)} />
                    </Field>
                    <Field label="Notas" className="md:col-span-2">
                        <textarea className={`${input} min-h-[50px]`} value={f.notes} onChange={(e) => set("notes", e.target.value)} />
                    </Field>
                </div>
                {msg && <p className={`mt-3 text-[0.8rem] ${msg.ok ? "text-good" : "text-danger"}`}>{msg.text}</p>}
                <div className="mt-5 border-t border-line pt-4">
                    <Button variant="danger" size="sm" icon={<Trash2 size={14} />} onClick={remove}>Eliminar evaluación</Button>
                </div>
            </Section>

            <Section title="Criterios de la metodología" subtitle={methodology.basis}>
                <div className="space-y-4 text-[0.8rem]">
                    <Criteria title="Probabilidad" items={methodology.probability} />
                    <Criteria title="Impacto" items={[...methodology.impactScale].reverse()} />
                    <div>
                        <p className="mb-1.5 text-[0.7rem] font-semibold uppercase tracking-[0.06em] text-faint">Nivel de riesgo = P × I</p>
                        <p className="text-muted"><span className="text-danger">Alto</span> 6 o más · <span className="text-warn">Medio</span> 3 a 5.99 · <span className="text-good">Bajo</span> menos de 3</p>
                    </div>
                    <div>
                        <p className="mb-1.5 text-[0.7rem] font-semibold uppercase tracking-[0.06em] text-faint">Tipos de impacto</p>
                        <ul className="space-y-1">
                            {methodology.riskImpactDimensions.map((d) => (
                                <li key={d.key}><span className="font-medium">{d.label}:</span> <span className="text-muted">{d.description}</span></li>
                            ))}
                        </ul>
                    </div>
                </div>
            </Section>
        </div>
    );
}

function Criteria({ title, items }: { title: string; items: { value: number; label: string; description?: string }[] }) {
    return (
        <div>
            <p className="mb-1.5 text-[0.7rem] font-semibold uppercase tracking-[0.06em] text-faint">{title}</p>
            <ul className="space-y-1">
                {items.map((i) => (
                    <li key={i.value}>
                        <span className="tnum font-medium">{i.value} · {i.label}:</span> <span className="text-muted">{i.description}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
}
