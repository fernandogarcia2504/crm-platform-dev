import { useContext, useEffect, useState, useCallback } from "react";

import { motion } from "framer-motion";
import { FileBarChart2, Download, Mail } from "lucide-react";

import PageHeader from "../../components/ui/PageHeader";
import Button from "../../components/ui/Button";
import { Spinner, ErrorText, EmptyState } from "../../components/ui/States";
import { ClientContext } from "../../app/context/ClientContext";
import NoClient from "./NoClient";
import type { Campaign } from "./types";
import { listCampaigns, generateReport } from "./services";

export default function ReportsPage() {
    const client = useContext(ClientContext)?.client ?? null;

    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [html, setHtml] = useState<string | null>(null);
    const [generating, setGenerating] = useState(false);

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

    const generate = async (id: string) => {
        setSelectedId(id);
        setGenerating(true);
        setHtml(null);
        try {
            const { html } = await generateReport(id);
            setHtml(html);
        } catch (e) {
            setError(e instanceof Error ? e.message : "Error al generar el reporte");
        } finally {
            setGenerating(false);
        }
    };

    const download = () => {
        if (!html) return;
        const blob = new Blob([html], { type: "text/html" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "reporte-atalaya.html";
        a.click();
        URL.revokeObjectURL(url);
    };

    if (!client) {
        return (<><PageHeader title="Reportes" subtitle="Reportes de concientización" /><NoClient /></>);
    }

    return (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
            <PageHeader title="Reportes" subtitle={`${client.companyName} · fase 1: lo generamos y enviamos nosotros`} />

            {loading && <Spinner label="Cargando..." />}
            {error && <ErrorText>{error}</ErrorText>}

            {!loading && !error && campaigns.length === 0 && (
                <div className="mt-8">
                    <EmptyState icon={<FileBarChart2 size={28} strokeWidth={1.5} />} title="Sin campañas" hint="Genera reportes a partir de las campañas de este cliente." />
                </div>
            )}

            {!loading && !error && campaigns.length > 0 && (
                <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-[260px_minmax(0,1fr)]">
                    <div className="flex flex-col gap-2">
                        {campaigns.map((c) => (
                            <button
                                key={c._id}
                                onClick={() => generate(c._id)}
                                className={[
                                    "rounded-lg border px-3 py-2.5 text-left transition-colors",
                                    selectedId === c._id ? "border-accent/50 bg-surface" : "border-line hover:border-line-2"
                                ].join(" ")}
                            >
                                <p className="text-[0.86rem] font-medium">{c.name}</p>
                                <p className="text-[0.74rem] text-faint">Reporte · {c.metrics.reportRate}%</p>
                            </button>
                        ))}
                    </div>

                    <div className="rounded-lg border border-line bg-surface p-5">
                        {!selectedId && <p className="py-16 text-center text-[0.85rem] text-faint">Elige una campaña para generar su reporte.</p>}
                        {generating && <Spinner label="Generando reporte..." />}
                        {html && !generating && (
                            <>
                                <div className="mb-3 flex items-center justify-between">
                                    <h2 className="text-[0.95rem] font-semibold">Vista previa</h2>
                                    <div className="flex gap-2">
                                        <Button variant="secondary" size="sm" icon={<Download size={14} />} onClick={download}>Descargar</Button>
                                        <Button size="sm" icon={<Mail size={14} />} onClick={() => alert("En fase 1 el envío es manual: descarga y envíalo al cliente.")}>Enviar</Button>
                                    </div>
                                </div>
                                <iframe title="reporte" srcDoc={html} className="h-[520px] w-full rounded-md border border-line-2 bg-white" />
                            </>
                        )}
                    </div>
                </div>
            )}
        </motion.div>
    );
}
