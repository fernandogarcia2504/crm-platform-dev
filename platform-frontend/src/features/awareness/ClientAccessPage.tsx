import { useContext, useEffect, useState, useCallback } from "react";

import { motion } from "framer-motion";
import { ShieldCheck, KeyRound, Copy, Power, Trash2, ExternalLink, RefreshCw } from "lucide-react";

import PageHeader from "../../components/ui/PageHeader";
import Button from "../../components/ui/Button";
import Badge from "../../components/ui/Badge";
import { Spinner, ErrorText, EmptyState } from "../../components/ui/States";
import { ClientContext } from "../../app/context/ClientContext";
import NoClient from "./NoClient";
import {
    listCompanyContacts,
    listClientAccounts,
    createClientAccount,
    regenerateClientCredentials,
    toggleClientAccount,
    deleteClientAccount,
    type CrmContact,
    type ClientAccount
} from "./clientAccess";

// URL del portal de cliente (solo para mostrarla al staff). Configurable
// por si cambia de dominio en producción.
const CLIENT_PORTAL_URL = import.meta.env.VITE_CLIENT_PORTAL_URL || "http://localhost:5177";

type Reveal = { name: string; username?: string; password?: string } | null;

export default function ClientAccessPage() {
    const clientCtx = useContext(ClientContext);
    const client = clientCtx?.client ?? null;

    const [contacts, setContacts] = useState<CrmContact[]>([]);
    const [accounts, setAccounts] = useState<ClientAccount[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [busyId, setBusyId] = useState<string | null>(null);
    const [reveal, setReveal] = useState<Reveal>(null);

    const load = useCallback(async () => {
        if (!client) return;
        try {
            setLoading(true);
            setError(null);
            const [cs, accs] = await Promise.all([
                listCompanyContacts(client.crmCompanyId).catch(() => []),
                listClientAccounts(client.crmCompanyId)
            ]);
            setContacts(cs);
            setAccounts(accs);
        } catch (e) {
            setError(e instanceof Error ? e.message : "Error al cargar los accesos");
        } finally {
            setLoading(false);
        }
    }, [client]);

    useEffect(() => { load(); }, [load]);

    const accountByContact = new Map(accounts.map((a) => [a.crmContactId, a]));

    const handleGenerate = async (c: CrmContact) => {
        if (!client) return;
        try {
            setBusyId(c.crmContactId);
            const account = await createClientAccount({
                crmCompanyId: client.crmCompanyId,
                companyName: client.companyName,
                crmContactId: c.crmContactId,
                fullName: c.fullName,
                email: c.email,
                position: c.position
            });
            setReveal({ name: account.fullName, username: account.username, password: account.temporaryPassword });
            await load();
        } catch (e) {
            setError(e instanceof Error ? e.message : "Error al generar el acceso");
        } finally {
            setBusyId(null);
        }
    };

    const handleRegenerate = async (a: ClientAccount) => {
        try {
            setBusyId(a._id);
            const updated = await regenerateClientCredentials(a._id);
            setReveal({ name: updated.fullName, username: updated.username, password: updated.temporaryPassword });
            await load();
        } catch (e) {
            setError(e instanceof Error ? e.message : "Error al regenerar");
        } finally {
            setBusyId(null);
        }
    };

    const handleToggle = async (a: ClientAccount) => {
        try {
            setBusyId(a._id);
            await toggleClientAccount(a._id, a.status === "Activo" ? "Inactivo" : "Activo");
            await load();
        } catch (e) {
            setError(e instanceof Error ? e.message : "Error al actualizar");
        } finally {
            setBusyId(null);
        }
    };

    const handleDelete = async (a: ClientAccount) => {
        try {
            setBusyId(a._id);
            await deleteClientAccount(a._id);
            await load();
        } catch (e) {
            setError(e instanceof Error ? e.message : "Error al eliminar");
        } finally {
            setBusyId(null);
        }
    };

    if (!client) {
        return (
            <>
                <PageHeader title="Accesos de cliente" subtitle="Portal de resultados para los contactos de la empresa" />
                <NoClient />
            </>
        );
    }

    const activeCount = accounts.filter((a) => a.status === "Activo").length;

    return (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
            <PageHeader
                title="Accesos de cliente"
                subtitle={client.companyName}
                count={activeCount}
                actions={
                    <Button variant="secondary" size="sm" icon={<RefreshCw size={14} />} onClick={load}>
                        Actualizar
                    </Button>
                }
            />

            <div className="mt-5 flex items-center justify-between gap-3 rounded-lg border border-line bg-surface px-4 py-3">
                <div className="flex items-center gap-2.5 text-[0.82rem] text-muted">
                    <ShieldCheck size={16} className="text-accent" />
                    <span>
                        Elige qué contactos pueden entrar al portal a ver el avance de las campañas.
                        Portal: <span className="text-ink">{CLIENT_PORTAL_URL}</span>
                    </span>
                </div>
                <a
                    href={CLIENT_PORTAL_URL}
                    target="_blank"
                    rel="noreferrer"
                    className="flex flex-none items-center gap-1.5 text-[0.8rem] text-accent hover:underline"
                >
                    Abrir portal <ExternalLink size={13} />
                </a>
            </div>

            {loading && <Spinner label="Cargando contactos..." />}
            {error && <ErrorText>{error}</ErrorText>}

            {!loading && !error && contacts.length === 0 && (
                <div className="mt-8">
                    <EmptyState
                        icon={<ShieldCheck size={28} strokeWidth={1.5} />}
                        title="Sin contactos en el CRM"
                        hint="Agrega contactos a esta empresa en el CRM para poder generarles acceso al portal."
                    />
                </div>
            )}

            {!loading && !error && contacts.length > 0 && (
                <div className="mt-6 overflow-hidden rounded-lg border border-line">
                    <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,1.4fr)_minmax(0,1fr)_150px] border-b border-line bg-surface px-4 py-2.5 text-[0.7rem] font-semibold uppercase tracking-[0.04em] text-faint">
                        <p>Contacto</p><p>Acceso</p><p>Último ingreso</p><p className="text-right">Acciones</p>
                    </div>
                    <div className="divide-y divide-line">
                        {contacts.map((c) => {
                            const acc = accountByContact.get(c.crmContactId);
                            const busy = busyId === (acc?._id ?? c.crmContactId);
                            return (
                                <div key={c.crmContactId} className="grid grid-cols-[minmax(0,2fr)_minmax(0,1.4fr)_minmax(0,1fr)_150px] items-center px-4 py-3 hover:bg-surface-2/50">
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2">
                                            <p className="truncate text-[0.88rem] font-medium">{c.fullName}</p>
                                            {c.isPrimary && <Badge tone="accent" dot={false}>Principal</Badge>}
                                        </div>
                                        <p className="truncate text-[0.76rem] text-faint">{c.position ? `${c.position} · ` : ""}{c.email}</p>
                                    </div>

                                    <div className="min-w-0">
                                        {acc ? (
                                            <div className="flex items-center gap-2">
                                                <Badge tone={acc.status === "Activo" ? "good" : "danger"}>{acc.status}</Badge>
                                                {acc.mustChangePassword && <Badge tone="warn" dot={false}>Temporal</Badge>}
                                            </div>
                                        ) : (
                                            <span className="text-[0.82rem] text-faint">Sin acceso</span>
                                        )}
                                    </div>

                                    <p className="truncate text-[0.82rem] text-muted">
                                        {acc?.lastLoginAt ? new Date(acc.lastLoginAt).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                                    </p>

                                    <div className="flex items-center justify-end gap-1">
                                        {!acc ? (
                                            <Button size="sm" disabled={busy} onClick={() => handleGenerate(c)}>
                                                {busy ? "..." : "Generar acceso"}
                                            </Button>
                                        ) : (
                                            <>
                                                <IconBtn title="Regenerar contraseña" disabled={busy} onClick={() => handleRegenerate(acc)}>
                                                    <KeyRound size={15} />
                                                </IconBtn>
                                                <IconBtn
                                                    title={acc.status === "Activo" ? "Desactivar" : "Activar"}
                                                    disabled={busy}
                                                    onClick={() => handleToggle(acc)}
                                                    tone={acc.status === "Activo" ? "warn" : "good"}
                                                >
                                                    <Power size={15} />
                                                </IconBtn>
                                                <IconBtn title="Eliminar acceso" disabled={busy} onClick={() => handleDelete(acc)} tone="danger">
                                                    <Trash2 size={15} />
                                                </IconBtn>
                                            </>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {reveal && <CredentialsModal data={reveal} onClose={() => setReveal(null)} />}
        </motion.div>
    );
}

function IconBtn({
    children, title, onClick, disabled, tone = "accent"
}: { children: React.ReactNode; title: string; onClick: () => void; disabled?: boolean; tone?: "accent" | "warn" | "good" | "danger" }) {
    const hover = {
        accent: "hover:text-accent",
        warn: "hover:text-warn",
        good: "hover:text-good",
        danger: "hover:text-danger"
    }[tone];
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            title={title}
            className={`rounded-md p-1.5 text-faint transition-colors hover:bg-surface-2 disabled:opacity-40 ${hover}`}
        >
            {children}
        </button>
    );
}

function CredentialsModal({ data, onClose }: { data: { name: string; username?: string; password?: string }; onClose: () => void }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm" onClick={onClose}>
            <div className="w-full max-w-[420px] rounded-xl border border-line bg-surface p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
                <h3 className="mb-1 text-[1rem] font-semibold">Credenciales del portal</h3>
                <p className="text-[0.84rem] text-muted">
                    Comparte estas credenciales con <b className="text-ink">{data.name}</b>. La contraseña solo se muestra una vez.
                </p>
                <div className="mt-3 flex flex-col gap-2">
                    <CredRow label="Usuario" value={data.username ?? "—"} />
                    <CredRow label="Contraseña temporal" value={data.password ?? "—"} />
                </div>
                <div className="mt-4 flex justify-end">
                    <Button size="sm" onClick={onClose}>Listo</Button>
                </div>
            </div>
        </div>
    );
}

function CredRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex items-center justify-between rounded-md border border-line-2 bg-surface-2 px-3 py-2">
            <div className="min-w-0">
                <p className="text-[0.7rem] text-faint">{label}</p>
                <p className="truncate font-mono text-[0.88rem]">{value}</p>
            </div>
            <button onClick={() => navigator.clipboard?.writeText(value)} className="flex-none text-faint hover:text-accent" title="Copiar">
                <Copy size={15} />
            </button>
        </div>
    );
}
