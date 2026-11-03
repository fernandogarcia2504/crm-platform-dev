import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";

import { motion } from "framer-motion";
import { ChevronLeft, Rocket, RefreshCw, Settings2, Save } from "lucide-react";

import { StatusBadge } from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import { Spinner, ErrorText } from "../../components/ui/States";
import type { Campaign, CampaignTarget } from "./types";
import { getCampaign, setTargetEvent, launchCampaign, syncCampaign, updateCampaign } from "./services";

const FUNNEL: { key: keyof CampaignTarget; label: string; tone: string }[] = [
    { key: "sent", label: "Enviado", tone: "bg-info" },
    { key: "opened", label: "Abrió", tone: "bg-info" },
    { key: "clicked", label: "Clic", tone: "bg-warn" },
    { key: "submittedData", label: "Envió datos", tone: "bg-danger" },
    { key: "reported", label: "Reportó", tone: "bg-good" }
];

const employeeName = (t: CampaignTarget) => (typeof t.employee === "object" ? t.employee.fullName : "Empleado");
const employeeMail = (t: CampaignTarget) => (typeof t.employee === "object" ? t.employee.email : "");

const input = "w-full rounded-md border border-line-2 bg-surface-2 px-3 py-2 text-[0.86rem] outline-none focus:border-accent";

export default function CampaignDetailPage() {
    const { campaignId } = useParams();
    const navigate = useNavigate();

    const [campaign, setCampaign] = useState<Campaign | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [msg, setMsg] = useState<{ tone: "ok" | "err"; text: string } | null>(null);

    const [launching, setLaunching] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const [showCfg, setShowCfg] = useState(false);
    const [saving, setSaving] = useState(false);
    const [cfg, setCfg] = useState({
        emailTemplate: "", landingPage: "", sendingProfile: "", senderDomain: "", campaignUrl: "", launchDate: ""
    });

    const applyCampaign = (c: Campaign) => {
        setCampaign(c);
        setCfg({
            emailTemplate: c.emailTemplate ?? "",
            landingPage: c.landingPage ?? "",
            sendingProfile: c.sendingProfile ?? "",
            senderDomain: c.senderDomain ?? "",
            campaignUrl: c.campaignUrl ?? "",
            launchDate: c.launchDate ? c.launchDate.slice(0, 10) : ""
        });
    };

    const load = useCallback(async () => {
        if (!campaignId) return;
        try {
            setLoading(true);
            setError(null);
            applyCampaign(await getCampaign(campaignId));
        } catch (e) {
            setError(e instanceof Error ? e.message : "Error al cargar la campaña");
        } finally {
            setLoading(false);
        }
    }, [campaignId]);

    useEffect(() => { load(); }, [load]);

    const toggleEvent = async (target: CampaignTarget, key: keyof CampaignTarget) => {
        if (!campaignId) return;
        try {
            setCampaign(await setTargetEvent(campaignId, target._id, key as string, !Boolean(target[key])));
        } catch (e) {
            setError(e instanceof Error ? e.message : "Error al actualizar");
        }
    };

    const saveCfg = async () => {
        if (!campaignId) return;
        try {
            setSaving(true);
            setMsg(null);
            applyCampaign(await updateCampaign(campaignId, cfg));
            setMsg({ tone: "ok", text: "Configuración guardada." });
        } catch (e) {
            setMsg({ tone: "err", text: e instanceof Error ? e.message : "Error al guardar" });
        } finally {
            setSaving(false);
        }
    };

    const doLaunch = async () => {
        if (!campaignId) return;
        try {
            setLaunching(true);
            setMsg(null);
            const { campaign: c, message } = await launchCampaign(campaignId);
            applyCampaign(c);
            setMsg({ tone: "ok", text: message || "Campaña lanzada." });
        } catch (e) {
            setMsg({ tone: "err", text: e instanceof Error ? e.message : "Error al lanzar" });
        } finally {
            setLaunching(false);
        }
    };

    const doSync = async () => {
        if (!campaignId) return;
        try {
            setSyncing(true);
            setMsg(null);
            applyCampaign(await syncCampaign(campaignId));
            setMsg({ tone: "ok", text: "Resultados sincronizados desde Gophish." });
        } catch (e) {
            setMsg({ tone: "err", text: e instanceof Error ? e.message : "Error al sincronizar" });
        } finally {
            setSyncing(false);
        }
    };

    return (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
            <button onClick={() => navigate("/concientizacion/campanas")} className="mt-9 flex w-fit items-center gap-1.5 text-[0.84rem] text-muted transition-colors hover:text-ink">
                <ChevronLeft size={16} /> Campañas
            </button>

            {loading && <Spinner label="Cargando campaña..." />}
            {error && <ErrorText>{error}</ErrorText>}

            {!loading && !error && campaign && (
                <>
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-b border-line pb-6">
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-[1.4rem] font-semibold tracking-tight">{campaign.name}</h1>
                                <StatusBadge status={campaign.status} />
                            </div>
                            <p className="mt-1 text-[0.85rem] text-muted">
                                {campaign.companyName}
                                {campaign.gophishCampaignId && <span className="text-faint"> · Gophish #{campaign.gophishCampaignId}</span>}
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="secondary" size="sm" icon={<Settings2 size={14} />} onClick={() => setShowCfg((v) => !v)}>Configurar</Button>
                            <Button variant="secondary" size="sm" icon={<RefreshCw size={14} className={syncing ? "animate-spin" : ""} />} disabled={syncing || !campaign.gophishCampaignId} onClick={doSync}>Sincronizar</Button>
                            <Button size="sm" icon={<Rocket size={14} />} disabled={launching} onClick={doLaunch}>{launching ? "Lanzando..." : "Lanzar"}</Button>
                        </div>
                    </div>

                    {msg && (
                        <div className={`mt-4 rounded-md border px-3.5 py-2.5 text-[0.84rem] ${msg.tone === "ok" ? "border-good/30 bg-good/10 text-good" : "border-danger/30 bg-danger/10 text-danger"}`}>
                            {msg.text}
                        </div>
                    )}

                    {/* configuración de Gophish */}
                    {showCfg && (
                        <div className="mt-5 rounded-lg border border-line bg-surface p-5">
                            <h2 className="mb-4 text-[0.95rem] font-semibold">Configuración de Gophish</h2>
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                <Field label="Plantilla de correo (template)"><input className={input} value={cfg.emailTemplate} onChange={(e) => setCfg({ ...cfg, emailTemplate: e.target.value })} placeholder="Nombre exacto en Gophish" /></Field>
                                <Field label="Landing page"><input className={input} value={cfg.landingPage} onChange={(e) => setCfg({ ...cfg, landingPage: e.target.value })} placeholder="Nombre exacto en Gophish" /></Field>
                                <Field label="Sending profile (SMTP)"><input className={input} value={cfg.sendingProfile} onChange={(e) => setCfg({ ...cfg, sendingProfile: e.target.value })} placeholder="Nombre exacto en Gophish" /></Field>
                                <Field label="URL de la campaña"><input className={input} value={cfg.campaignUrl} onChange={(e) => setCfg({ ...cfg, campaignUrl: e.target.value })} placeholder="https://track.midominio.com" /></Field>
                                <Field label="Dominio del remitente"><input className={input} value={cfg.senderDomain} onChange={(e) => setCfg({ ...cfg, senderDomain: e.target.value })} placeholder="midominio.com" /></Field>
                                <Field label="Fecha de lanzamiento"><input type="date" className={input} value={cfg.launchDate} onChange={(e) => setCfg({ ...cfg, launchDate: e.target.value })} /></Field>
                            </div>
                            <div className="mt-4 flex justify-end">
                                <Button size="sm" icon={<Save size={14} />} disabled={saving} onClick={saveCfg}>{saving ? "Guardando..." : "Guardar"}</Button>
                            </div>
                            <p className="mt-2 text-[0.74rem] text-faint">Los nombres deben coincidir con los objetos ya creados en tu servidor Gophish.</p>
                        </div>
                    )}

                    {/* embudo */}
                    <div className="mt-6 rounded-lg border border-line bg-surface p-5">
                        <h2 className="mb-4 text-[0.95rem] font-semibold">Embudo</h2>
                        <div className="flex flex-col gap-3">
                            {FUNNEL.map((stage) => {
                                const count = campaign.targets.filter((t) => t[stage.key]).length;
                                const total = campaign.targets.length || 1;
                                const pct = Math.round((count / total) * 100);
                                return (
                                    <div key={stage.key as string}>
                                        <div className="mb-1 flex items-center justify-between text-[0.82rem]">
                                            <span className="text-muted">{stage.label}</span>
                                            <span className="tnum font-medium">{count} · {pct}%</span>
                                        </div>
                                        <div className="h-2 w-full overflow-hidden rounded-full bg-surface-2">
                                            <div className={`h-full rounded-full ${stage.tone}`} style={{ width: `${pct}%` }} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <p className="mt-4 text-[0.76rem] text-faint">
                            Puedes <b>Lanzar</b> en Gophish y <b>Sincronizar</b> los resultados, o capturar cada evento a mano abajo.
                        </p>
                    </div>

                    {/* objetivos */}
                    <div className="mt-6 overflow-x-auto rounded-lg border border-line">
                        <div className="grid min-w-[560px] grid-cols-[minmax(0,2fr)_repeat(5,1fr)] border-b border-line bg-surface px-4 py-2.5 text-[0.68rem] font-semibold uppercase tracking-[0.03em] text-faint">
                            <p>Empleado</p>
                            {FUNNEL.map((s) => <p key={s.key as string} className="text-center">{s.label}</p>)}
                        </div>
                        <div className="min-w-[560px] divide-y divide-line">
                            {campaign.targets.map((t) => (
                                <div key={t._id} className="grid grid-cols-[minmax(0,2fr)_repeat(5,1fr)] items-center px-4 py-2.5">
                                    <div className="min-w-0">
                                        <p className="truncate text-[0.86rem] font-medium">{employeeName(t)}</p>
                                        <p className="truncate text-[0.72rem] text-faint">{employeeMail(t)}</p>
                                    </div>
                                    {FUNNEL.map((s) => {
                                        const on = Boolean(t[s.key]);
                                        return (
                                            <div key={s.key as string} className="flex justify-center">
                                                <button
                                                    onClick={() => toggleEvent(t, s.key)}
                                                    className={["h-5 w-5 rounded-full border transition-colors", on ? `${s.tone} border-transparent` : "border-line-2 hover:border-faint"].join(" ")}
                                                    aria-label={`${s.label}: ${on ? "sí" : "no"}`}
                                                />
                                            </div>
                                        );
                                    })}
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </motion.div>
    );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <label className="flex flex-col gap-1.5">
            <span className="text-[0.78rem] text-muted">{label}</span>
            {children}
        </label>
    );
}
