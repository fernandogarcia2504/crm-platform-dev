import { useContext, useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";

import { motion } from "framer-motion";
import { Plus, Send } from "lucide-react";

import PageHeader from "../../components/ui/PageHeader";
import Button from "../../components/ui/Button";
import { StatusBadge } from "../../components/ui/Badge";
import { Spinner, ErrorText, EmptyState } from "../../components/ui/States";
import { ClientContext } from "../../app/context/ClientContext";
import NoClient from "./NoClient";
import type { Campaign, Employee } from "./types";
import { listCampaigns, createCampaign, listEmployees } from "./services";

export default function CampaignsPage() {
    const navigate = useNavigate();
    const client = useContext(ClientContext)?.client ?? null;

    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [modal, setModal] = useState(false);

    const load = useCallback(async () => {
        if (!client) return;
        try {
            setLoading(true);
            setError(null);
            setCampaigns(await listCampaigns(client.crmCompanyId));
        } catch (e) {
            setError(e instanceof Error ? e.message : "Error al cargar campañas");
        } finally {
            setLoading(false);
        }
    }, [client]);

    useEffect(() => { load(); }, [load]);

    if (!client) {
        return (<><PageHeader title="Campañas" subtitle="Simulaciones de phishing" /><NoClient /></>);
    }

    return (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
            <PageHeader
                title="Campañas"
                subtitle={client.companyName}
                count={campaigns.length}
                actions={<Button icon={<Plus size={15} />} onClick={() => setModal(true)}>Nueva campaña</Button>}
            />

            {loading && <Spinner label="Cargando campañas..." />}
            {error && <ErrorText>{error}</ErrorText>}

            {!loading && !error && campaigns.length === 0 && (
                <div className="mt-8">
                    <EmptyState
                        icon={<Send size={28} strokeWidth={1.5} />}
                        title="Sin campañas"
                        hint="Crea una simulación de phishing sobre los empleados cargados."
                        action={<Button icon={<Plus size={15} />} onClick={() => setModal(true)}>Nueva campaña</Button>}
                    />
                </div>
            )}

            {!loading && !error && campaigns.length > 0 && (
                <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {campaigns.map((c) => (
                        <button
                            key={c._id}
                            onClick={() => navigate(`/concientizacion/campanas/${c._id}`)}
                            className="flex flex-col gap-4 rounded-lg border border-line bg-surface p-5 text-left transition-colors hover:border-accent/50"
                        >
                            <div className="flex items-start justify-between gap-2">
                                <p className="font-medium leading-snug">{c.name}</p>
                                <StatusBadge status={c.status} />
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                                <Metric label="Enviados" value={c.metrics.sent} />
                                <Metric label="Clic" value={`${c.metrics.clickRate}%`} tone="text-warn" />
                                <Metric label="Reporte" value={`${c.metrics.reportRate}%`} tone="text-good" />
                            </div>
                        </button>
                    ))}
                </div>
            )}

            {modal && (
                <NewCampaignModal
                    client={client}
                    onClose={() => setModal(false)}
                    onCreated={() => { setModal(false); load(); }}
                />
            )}
        </motion.div>
    );
}

function Metric({ label, value, tone }: { label: string; value: number | string; tone?: string }) {
    return (
        <div className="rounded-md bg-surface-2 px-2.5 py-2">
            <p className={`tnum text-[1.1rem] font-semibold leading-none ${tone ?? ""}`}>{value}</p>
            <p className="mt-1 text-[0.68rem] text-faint">{label}</p>
        </div>
    );
}

function NewCampaignModal({
    client, onClose, onCreated
}: { client: { crmCompanyId: string; companyName: string }; onClose: () => void; onCreated: () => void }) {
    const [name, setName] = useState("");
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [picked, setPicked] = useState<Set<string>>(new Set());
    const [saving, setSaving] = useState(false);
    const [err, setErr] = useState<string | null>(null);

    useEffect(() => {
        listEmployees(client.crmCompanyId).then(setEmployees).catch(() => setEmployees([]));
    }, [client.crmCompanyId]);

    const toggle = (id: string) => {
        setPicked((prev) => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const submit = async () => {
        if (!name) { setErr("El nombre es requerido"); return; }
        if (picked.size === 0) { setErr("Selecciona al menos un empleado"); return; }
        try {
            setSaving(true);
            await createCampaign({
                crmCompanyId: client.crmCompanyId,
                companyName: client.companyName,
                name,
                employeeIds: [...picked]
            });
            onCreated();
        } catch (e) {
            setErr(e instanceof Error ? e.message : "Error al crear");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm" onClick={onClose}>
            <div className="flex max-h-[85vh] w-full max-w-[480px] flex-col rounded-xl border border-line bg-surface p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
                <h3 className="mb-4 text-[1rem] font-semibold">Nueva campaña</h3>
                <input
                    className="mb-3 w-full rounded-md border border-line-2 bg-surface-2 px-3 py-2 text-[0.88rem] outline-none focus:border-accent"
                    placeholder="Nombre (ej. Aviso de nómina Q1)"
                    value={name} onChange={(e) => setName(e.target.value)}
                />
                <p className="mb-2 text-[0.78rem] text-muted">Objetivos ({picked.size} seleccionados)</p>
                <div className="flex-1 overflow-y-auto rounded-md border border-line-2">
                    {employees.length === 0 && <p className="p-4 text-center text-[0.82rem] text-faint">No hay empleados cargados</p>}
                    {employees.map((e) => (
                        <label key={e._id} className="flex cursor-pointer items-center gap-2.5 border-b border-line px-3 py-2 last:border-b-0 hover:bg-surface-2/50">
                            <input type="checkbox" checked={picked.has(e._id)} onChange={() => toggle(e._id)} className="accent-[var(--color-accent)]" />
                            <span className="min-w-0 flex-1">
                                <span className="block truncate text-[0.84rem]">{e.fullName}</span>
                                <span className="block truncate text-[0.72rem] text-faint">{e.email}</span>
                            </span>
                        </label>
                    ))}
                </div>
                {err && <p className="mt-2 text-[0.8rem] text-danger">{err}</p>}
                <div className="mt-4 flex justify-end gap-2">
                    <Button variant="ghost" size="sm" onClick={onClose}>Cancelar</Button>
                    <Button size="sm" disabled={saving} onClick={submit}>{saving ? "Creando..." : "Crear campaña"}</Button>
                </div>
            </div>
        </div>
    );
}
