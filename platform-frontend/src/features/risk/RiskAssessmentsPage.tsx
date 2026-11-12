import { useContext, useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";

import { motion } from "framer-motion";
import { Plus, ShieldAlert } from "lucide-react";

import PageHeader from "../../components/ui/PageHeader";
import Button from "../../components/ui/Button";
import Badge from "../../components/ui/Badge";
import { Spinner, ErrorText, EmptyState } from "../../components/ui/States";
import { ClientContext, type SelectedClient } from "../../app/context/ClientContext";
import NoClient from "../awareness/NoClient";
import type { Assessment, CrmProject } from "./types";
import { listAssessments, createAssessment, listRiskProjects } from "./services";
import { Modal, Field, Metric } from "./RiskUi";
import { input, errMsg, assessmentTone } from "./riskHelpers";

export default function RiskAssessmentsPage() {
    const navigate = useNavigate();
    const client = useContext(ClientContext)?.client ?? null;

    const [assessments, setAssessments] = useState<Assessment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [modal, setModal] = useState(false);

    // Sin setState antes del primer await (regla react-hooks/set-state-in-effect)
    const load = useCallback(async () => {
        if (!client) return;
        try {
            const list = await listAssessments(client.crmCompanyId);
            setAssessments(list);
            setError(null);
        } catch (e) {
            setError(errMsg(e, "Error al cargar evaluaciones"));
        } finally {
            setLoading(false);
        }
    }, [client]);

    useEffect(() => { load(); }, [load]);

    if (!client) {
        return (<><PageHeader title="Evaluaciones de riesgo" subtitle="ISO/IEC 27001:2022" /><NoClient /></>);
    }

    return (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
            <PageHeader
                title="Evaluaciones de riesgo"
                subtitle={client.companyName}
                count={assessments.length}
                actions={<Button icon={<Plus size={15} />} onClick={() => setModal(true)}>Nueva evaluación</Button>}
            />

            {loading && <Spinner label="Cargando evaluaciones..." />}
            {error && <ErrorText>{error}</ErrorText>}

            {!loading && !error && assessments.length === 0 && (
                <div className="mt-8">
                    <EmptyState
                        icon={<ShieldAlert size={28} strokeWidth={1.5} />}
                        title="Sin evaluaciones"
                        hint="Crea una evaluación ligada a un proyecto de la línea Riesgos del CRM."
                        action={<Button icon={<Plus size={15} />} onClick={() => setModal(true)}>Nueva evaluación</Button>}
                    />
                </div>
            )}

            {!loading && !error && assessments.length > 0 && (
                <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
                    {assessments.map((a) => (
                        <button
                            key={a._id}
                            onClick={() => navigate(`/riesgos/${a._id}`)}
                            className="flex flex-col gap-4 rounded-lg border border-line bg-surface p-5 text-left transition-colors hover:border-accent/50"
                        >
                            <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                    <p className="font-medium leading-snug">{a.name}</p>
                                    <p className="mt-0.5 truncate text-[0.75rem] text-faint">
                                        {a.crmProjectName ? `Proyecto: ${a.crmProjectName}` : "Sin proyecto del CRM"} · {a.framework}
                                    </p>
                                </div>
                                <Badge tone={assessmentTone[a.status]}>{a.status}</Badge>
                            </div>
                            <div className="grid grid-cols-4 gap-2">
                                <Metric label="Riesgos" value={a.summary?.totalRisks ?? 0} />
                                <Metric label="Altos" value={a.summary?.inherentByLevel.Alto ?? 0} tone="text-danger" />
                                <Metric label="Fuera de apetito" value={a.summary?.outsideAppetite ?? 0} tone="text-warn" />
                                <Metric
                                    label="Tratamientos"
                                    value={`${a.summary?.treatments.implemented ?? 0}/${a.summary?.treatments.total ?? 0}`}
                                    tone="text-good"
                                />
                            </div>
                        </button>
                    ))}
                </div>
            )}

            {modal && (
                <NewAssessmentModal
                    client={client}
                    onClose={() => setModal(false)}
                    onCreated={(id) => { setModal(false); navigate(`/riesgos/${id}`); }}
                />
            )}
        </motion.div>
    );
}

function NewAssessmentModal({ client, onClose, onCreated }: {
    client: SelectedClient; onClose: () => void; onCreated: (id: string) => void;
}) {
    const [projects, setProjects] = useState<CrmProject[]>([]);
    const [projectsErr, setProjectsErr] = useState<string | null>(null);
    const [form, setForm] = useState({ name: "", crmProjectId: "", scope: "", acceptanceLevel: "Bajo" });
    const [saving, setSaving] = useState(false);
    const [err, setErr] = useState<string | null>(null);

    useEffect(() => {
        listRiskProjects(client.crmCompanyId)
            .then(setProjects)
            .catch((e) => setProjectsErr(errMsg(e, "No se pudieron leer los proyectos del CRM")));
    }, [client.crmCompanyId]);

    const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

    const pickProject = (id: string) => {
        const p = projects.find((x) => x.crmProjectId === id);
        setForm((f) => ({ ...f, crmProjectId: id, name: f.name || (p ? p.name : "") }));
    };

    const submit = async () => {
        if (!form.name) { setErr("El nombre es requerido"); return; }
        try {
            setSaving(true);
            const p = projects.find((x) => x.crmProjectId === form.crmProjectId);
            const a = await createAssessment({
                crmCompanyId: client.crmCompanyId,
                companyName: client.companyName,
                crmProjectId: p?.crmProjectId ?? null,
                crmProjectName: p?.name ?? null,
                name: form.name,
                scope: form.scope,
                acceptanceLevel: form.acceptanceLevel,
                startDate: new Date().toISOString()
            });
            onCreated(a._id);
        } catch (e) {
            setErr(errMsg(e, "Error al crear"));
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal
            title="Nueva evaluación de riesgos"
            onClose={onClose}
            footer={<>
                <Button variant="ghost" size="sm" onClick={onClose}>Cancelar</Button>
                <Button size="sm" disabled={saving} onClick={submit}>{saving ? "Creando..." : "Crear evaluación"}</Button>
            </>}
        >
            <div className="space-y-3">
                <Field
                    label="Proyecto del CRM (línea Riesgos)"
                    hint={projectsErr ?? (projects.length === 0 ? "No hay proyectos de la línea Riesgos para este cliente; puedes crearla sin ligar." : undefined)}
                >
                    <select className={input} value={form.crmProjectId} onChange={(e) => pickProject(e.target.value)}>
                        <option value="">— Sin ligar —</option>
                        {projects.map((p) => (
                            <option key={p.crmProjectId} value={p.crmProjectId}>{p.name} ({p.status})</option>
                        ))}
                    </select>
                </Field>
                <Field label="Nombre">
                    <input className={input} value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Evaluación de riesgos SGSI 2026" />
                </Field>
                <Field label="Alcance" hint="Procesos, sedes, sistemas y límites (ISO 27001 cl. 4.3).">
                    <textarea className={`${input} min-h-[80px]`} value={form.scope} onChange={(e) => set("scope", e.target.value)} />
                </Field>
                <Field label="Nivel de riesgo aceptable (apetito)" hint="Riesgos por encima de este nivel requieren tratamiento.">
                    <select className={input} value={form.acceptanceLevel} onChange={(e) => set("acceptanceLevel", e.target.value)}>
                        <option>Bajo</option><option>Medio</option><option>Alto</option>
                    </select>
                </Field>
                {err && <p className="text-[0.8rem] text-danger">{err}</p>}
            </div>
        </Modal>
    );
}
