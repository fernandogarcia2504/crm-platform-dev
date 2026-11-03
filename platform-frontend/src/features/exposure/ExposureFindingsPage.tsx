import { motion } from "framer-motion";

import PageHeader from "../../components/ui/PageHeader";
import DesignBanner from "./DesignBanner";

const SEV = [
    { label: "Crítica", n: 2, tone: "text-danger", bg: "bg-danger/12" },
    { label: "Alta", n: 5, tone: "text-warn", bg: "bg-warn/12" },
    { label: "Media", n: 11, tone: "text-info", bg: "bg-info/12" },
    { label: "Baja", n: 23, tone: "text-muted", bg: "bg-surface-2" }
];

type Finding = { asset: string; title: string; sev: string; sevTone: string; tool: string; seen: string };

const FINDINGS: Finding[] = [
    { asset: "crm.garciaconsulting.com.mx", title: "Panel de login expuesto sin MFA", sev: "Crítica", sevTone: "text-danger bg-danger/12", tool: "nuclei", seen: "hace 2 d" },
    { asset: "203.0.113.24:3389", title: "RDP accesible desde Internet", sev: "Crítica", sevTone: "text-danger bg-danger/12", tool: "naabu", seen: "hace 2 d" },
    { asset: "mail.garciaconsulting.com.mx", title: "SPF/DMARC ausente", sev: "Alta", sevTone: "text-warn bg-warn/12", tool: "motor", seen: "hace 2 d" },
    { asset: "nando@garciaconsulting.com.mx", title: "Credenciales en brecha (2 fuentes)", sev: "Alta", sevTone: "text-warn bg-warn/12", tool: "HIBP / IntelX", seen: "hace 5 d" },
    { asset: "www.garciaconsulting.com.mx", title: "TLS 1.0/1.1 habilitado", sev: "Media", sevTone: "text-info bg-info/12", tool: "testssl", seen: "hace 2 d" },
    { asset: "api.garciaconsulting.com.mx", title: "Cabeceras de seguridad faltantes", sev: "Media", sevTone: "text-info bg-info/12", tool: "httpx", seen: "hace 2 d" }
];

export default function ExposureFindingsPage() {
    return (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
            <PageHeader title="Hallazgos" subtitle="Superficie expuesta de García Consulting" count={41} />
            <DesignBanner />

            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {SEV.map((s) => (
                    <div key={s.label} className="rounded-lg border border-line bg-surface p-4">
                        <p className={`tnum text-[1.7rem] font-semibold leading-none ${s.tone}`}>{s.n}</p>
                        <div className="mt-2 flex items-center gap-1.5">
                            <span className={`h-2 w-2 rounded-full ${s.tone.replace("text-", "bg-")}`} />
                            <p className="text-[0.8rem] text-muted">{s.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-6 overflow-hidden rounded-lg border border-line">
                <div className="grid grid-cols-[minmax(0,2fr)_90px_minmax(0,1fr)_90px] border-b border-line bg-surface px-4 py-2.5 text-[0.7rem] font-semibold uppercase tracking-[0.04em] text-faint">
                    <p>Hallazgo</p><p>Severidad</p><p>Fuente</p><p className="text-right">Visto</p>
                </div>
                <div className="divide-y divide-line">
                    {FINDINGS.map((f, i) => (
                        <div key={i} className="grid grid-cols-[minmax(0,2fr)_90px_minmax(0,1fr)_90px] items-center px-4 py-3 hover:bg-surface-2/50">
                            <div className="min-w-0 pr-3">
                                <p className="truncate text-[0.88rem] font-medium">{f.title}</p>
                                <p className="truncate font-mono text-[0.74rem] text-faint">{f.asset}</p>
                            </div>
                            <div><span className={`rounded px-1.5 py-0.5 text-[0.72rem] font-semibold ${f.sevTone}`}>{f.sev}</span></div>
                            <p className="truncate font-mono text-[0.76rem] text-muted">{f.tool}</p>
                            <p className="text-right text-[0.78rem] text-faint">{f.seen}</p>
                        </div>
                    ))}
                </div>
            </div>
        </motion.div>
    );
}
