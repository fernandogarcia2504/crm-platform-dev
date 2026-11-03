import { useContext, useEffect, useState, useCallback } from "react";

import { motion } from "framer-motion";
import { Plus, Users, KeyRound, Copy } from "lucide-react";

import PageHeader from "../../components/ui/PageHeader";
import Button from "../../components/ui/Button";
import Badge from "../../components/ui/Badge";
import { Spinner, ErrorText, EmptyState } from "../../components/ui/States";
import { ClientContext } from "../../app/context/ClientContext";
import NoClient from "./NoClient";
import type { Employee } from "./types";
import { listEmployees, createEmployee, regenerateCredentials } from "./services";

export default function EmployeesPage() {
    const clientCtx = useContext(ClientContext);
    const client = clientCtx?.client ?? null;

    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [modal, setModal] = useState(false);
    const [reveal, setReveal] = useState<{ name: string; username?: string; password?: string } | null>(null);

    const load = useCallback(async () => {
        if (!client) return;
        try {
            setLoading(true);
            setError(null);
            setEmployees(await listEmployees(client.crmCompanyId));
        } catch (e) {
            setError(e instanceof Error ? e.message : "Error al cargar empleados");
        } finally {
            setLoading(false);
        }
    }, [client]);

    useEffect(() => { load(); }, [load]);

    if (!client) {
        return (
            <>
                <PageHeader title="Empleados" subtitle="Colaboradores objetivo de las campañas y el curso" />
                <NoClient />
            </>
        );
    }

    return (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
            <PageHeader
                title="Empleados"
                subtitle={client.companyName}
                count={employees.length}
                actions={<Button icon={<Plus size={15} />} onClick={() => setModal(true)}>Agregar empleado</Button>}
            />

            {loading && <Spinner label="Cargando empleados..." />}
            {error && <ErrorText>{error}</ErrorText>}

            {!loading && !error && employees.length === 0 && (
                <div className="mt-8">
                    <EmptyState
                        icon={<Users size={28} strokeWidth={1.5} />}
                        title="Sin empleados"
                        hint="Agrega colaboradores para enrolarlos al curso y usarlos en campañas."
                        action={<Button icon={<Plus size={15} />} onClick={() => setModal(true)}>Agregar empleado</Button>}
                    />
                </div>
            )}

            {!loading && !error && employees.length > 0 && (
                <div className="mt-6 overflow-hidden rounded-lg border border-line">
                    <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1.2fr)_90px] border-b border-line bg-surface px-4 py-2.5 text-[0.7rem] font-semibold uppercase tracking-[0.04em] text-faint">
                        <p>Empleado</p><p>Sector</p><p>Curso</p><p className="text-right">Acceso</p>
                    </div>
                    <div className="divide-y divide-line">
                        {employees.map((e) => (
                            <div key={e._id} className="grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1.2fr)_90px] items-center px-4 py-3 hover:bg-surface-2/50">
                                <div className="min-w-0">
                                    <p className="truncate text-[0.88rem] font-medium">{e.fullName}</p>
                                    <p className="truncate text-[0.76rem] text-faint">{e.email}</p>
                                </div>
                                <p className="truncate text-[0.84rem] text-muted">{e.sector || "—"}</p>
                                <div className="flex items-center gap-2">
                                    {e.courseAccount?.completed ? (
                                        <Badge tone="good">Completado</Badge>
                                    ) : e.courseAccount?.enrolled ? (
                                        <Badge tone="info">{e.courseAccount.progress ?? 0}%</Badge>
                                    ) : (
                                        <Badge tone="neutral">Sin enrolar</Badge>
                                    )}
                                </div>
                                <div className="flex justify-end">
                                    <button
                                        onClick={async () => {
                                            try {
                                                const updated = await regenerateCredentials(client.crmCompanyId, e._id);
                                                setReveal({ name: e.fullName, username: updated.courseAccount?.username, password: updated.temporaryPassword });
                                            } catch (err) {
                                                setError(err instanceof Error ? err.message : "Error");
                                            }
                                        }}
                                        className="rounded-md p-1.5 text-faint transition-colors hover:bg-surface-2 hover:text-accent"
                                        title="Regenerar credenciales"
                                    >
                                        <KeyRound size={15} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {modal && (
                <AddEmployeeModal
                    client={client}
                    onClose={() => setModal(false)}
                    onCreated={(emp) => {
                        setModal(false);
                        setReveal({ name: emp.fullName, username: emp.courseAccount?.username, password: emp.temporaryPassword });
                        load();
                    }}
                />
            )}

            {reveal && <CredentialsModal data={reveal} onClose={() => setReveal(null)} />}
        </motion.div>
    );
}

function AddEmployeeModal({
    client, onClose, onCreated
}: { client: { crmCompanyId: string; companyName: string }; onClose: () => void; onCreated: (e: Employee) => void }) {
    const [form, setForm] = useState({ fullName: "", email: "", position: "", sector: "" });
    const [saving, setSaving] = useState(false);
    const [err, setErr] = useState<string | null>(null);

    const submit = async () => {
        if (!form.fullName || !form.email) { setErr("Nombre y correo son requeridos"); return; }
        try {
            setSaving(true);
            const emp = await createEmployee({ crmCompanyId: client.crmCompanyId, companyName: client.companyName, ...form });
            onCreated(emp);
        } catch (e) {
            setErr(e instanceof Error ? e.message : "Error al crear");
        } finally {
            setSaving(false);
        }
    };

    const input = "w-full rounded-md border border-line-2 bg-surface-2 px-3 py-2 text-[0.88rem] outline-none focus:border-accent";

    return (
        <Modal onClose={onClose} title="Agregar empleado">
            <div className="flex flex-col gap-3">
                <input className={input} placeholder="Nombre completo" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
                <input className={input} placeholder="Correo" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                <div className="flex gap-3">
                    <input className={input} placeholder="Puesto" value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} />
                    <input className={input} placeholder="Sector / área" value={form.sector} onChange={(e) => setForm({ ...form, sector: e.target.value })} />
                </div>
                {err && <p className="text-[0.8rem] text-danger">{err}</p>}
                <div className="mt-1 flex justify-end gap-2">
                    <Button variant="ghost" size="sm" onClick={onClose}>Cancelar</Button>
                    <Button size="sm" disabled={saving} onClick={submit}>{saving ? "Guardando..." : "Crear"}</Button>
                </div>
            </div>
        </Modal>
    );
}

function CredentialsModal({ data, onClose }: { data: { name: string; username?: string; password?: string }; onClose: () => void }) {
    return (
        <Modal onClose={onClose} title="Credenciales del curso">
            <p className="text-[0.84rem] text-muted">Comparte estas credenciales con <b className="text-ink">{data.name}</b>. La contraseña solo se muestra una vez.</p>
            <div className="mt-3 flex flex-col gap-2">
                <CredRow label="Usuario" value={data.username ?? "—"} />
                <CredRow label="Contraseña temporal" value={data.password ?? "—"} />
            </div>
            <div className="mt-4 flex justify-end">
                <Button size="sm" onClick={onClose}>Listo</Button>
            </div>
        </Modal>
    );
}

function CredRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex items-center justify-between rounded-md border border-line-2 bg-surface-2 px-3 py-2">
            <div>
                <p className="text-[0.7rem] text-faint">{label}</p>
                <p className="font-mono text-[0.88rem]">{value}</p>
            </div>
            <button onClick={() => navigator.clipboard?.writeText(value)} className="text-faint hover:text-accent" title="Copiar">
                <Copy size={15} />
            </button>
        </div>
    );
}

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm" onClick={onClose}>
            <div className="w-full max-w-[420px] rounded-xl border border-line bg-surface p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
                <h3 className="mb-4 text-[1rem] font-semibold">{title}</h3>
                {children}
            </div>
        </div>
    );
}
