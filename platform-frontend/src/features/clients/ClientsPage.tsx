import { useContext, useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";

import { motion } from "framer-motion";
import { Building2, Check, Search, RefreshCw } from "lucide-react";

import PageHeader from "../../components/ui/PageHeader";
import Button from "../../components/ui/Button";
import { Spinner, ErrorText, EmptyState } from "../../components/ui/States";
import { ClientContext, type SelectedClient } from "../../app/context/ClientContext";
import { api } from "../../lib/api";

interface CrmClient extends SelectedClient {
    website?: string;
    status?: string;
    lines?: string[];
}

export default function ClientsPage() {
    const navigate = useNavigate();
    const clientCtx = useContext(ClientContext);

    const [clients, setClients] = useState<CrmClient[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [q, setQ] = useState("");

    const load = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const { clients } = await api.get<{ clients: CrmClient[] }>("/crm/companies");
            setClients(clients);
        } catch (e) {
            setError(e instanceof Error ? e.message : "Error al cargar clientes del CRM");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const select = (c: CrmClient) => {
        clientCtx?.setClient({ crmCompanyId: c.crmCompanyId, companyName: c.companyName });
        navigate("/panel");
    };

    const filtered = clients.filter((c) =>
        c.companyName.toLowerCase().includes(q.toLowerCase())
    );

    return (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
            <PageHeader
                title="Clientes"
                subtitle="Empresas del CRM — elige sobre cuál operar"
                count={clients.length}
                actions={<Button variant="secondary" size="sm" icon={<RefreshCw size={14} />} onClick={load}>Actualizar</Button>}
            />

            <label className="mt-6 flex w-full max-w-[360px] items-center gap-2 rounded-md border border-line-2 bg-surface-2 px-3 py-2">
                <Search size={15} className="text-faint" />
                <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Buscar empresa…"
                    className="w-full bg-transparent text-[0.88rem] outline-none"
                />
            </label>

            <div className="mt-5">
                {loading && <Spinner label="Cargando clientes del CRM..." />}
                {error && <ErrorText>{error}</ErrorText>}

                {!loading && !error && clients.length === 0 && (
                    <EmptyState
                        icon={<Building2 size={28} strokeWidth={1.5} />}
                        title="Sin clientes en el CRM"
                        hint="Crea empresas en el CRM y aparecerán aquí para operar."
                    />
                )}

                {!loading && !error && filtered.length > 0 && (
                    <div className="overflow-hidden rounded-lg border border-line">
                        {filtered.map((c) => {
                            const active = clientCtx?.client?.crmCompanyId === c.crmCompanyId;
                            return (
                                <div
                                    key={c.crmCompanyId}
                                    className="flex items-center justify-between border-b border-line px-4 py-3 last:border-b-0 hover:bg-surface-2/50"
                                >
                                    <div className="flex min-w-0 items-center gap-3">
                                        <span className="flex h-8 w-8 flex-none items-center justify-center rounded-lg bg-surface-2 text-[0.72rem] font-semibold text-muted">
                                            {c.companyName.slice(0, 2).toUpperCase()}
                                        </span>
                                        <div className="min-w-0">
                                            <p className="truncate text-[0.9rem] font-medium">{c.companyName}</p>
                                            <p className="truncate text-[0.74rem] text-faint">{c.website || c.crmCompanyId}</p>
                                        </div>
                                        {c.lines && c.lines.length > 0 && (
                                            <div className="ml-2 hidden gap-1 sm:flex">
                                                {c.lines.slice(0, 2).map((l) => (
                                                    <span key={l} className="rounded bg-surface-2 px-1.5 py-0.5 text-[0.68rem] text-muted">{l}</span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    {active ? (
                                        <span className="flex items-center gap-1.5 text-[0.8rem] font-semibold text-good">
                                            <Check size={15} /> Activo
                                        </span>
                                    ) : (
                                        <Button variant="secondary" size="sm" onClick={() => select(c)}>Operar</Button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </motion.div>
    );
}
