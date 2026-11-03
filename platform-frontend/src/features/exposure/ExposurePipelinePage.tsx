import { motion } from "framer-motion";
import { Check, Loader2, Circle } from "lucide-react";

import PageHeader from "../../components/ui/PageHeader";
import DesignBanner from "./DesignBanner";

type Step = {
    name: string;
    detail: string;
    tools: string[];
    state: "done" | "running" | "pending";
    found?: string;
};

const STEPS: Step[] = [
    { name: "Descubrimiento de activos", detail: "Subdominios y hosts expuestos", tools: ["subfinder", "amass", "crt.sh", "assetfinder"], state: "done", found: "42 subdominios" },
    { name: "Resolución DNS", detail: "Hosts vivos y registros", tools: ["dnsx"], state: "done", found: "31 activos" },
    { name: "Servicios web", detail: "Fingerprint y tecnologías", tools: ["httpx", "katana"], state: "done", found: "18 apps" },
    { name: "Puertos y servicios", detail: "Superficie de red", tools: ["naabu", "nmap"], state: "running", found: "en curso…" },
    { name: "Vulnerabilidades", detail: "Plantillas y CVEs", tools: ["nuclei", "testssl"], state: "pending" },
    { name: "Fugas y credenciales", detail: "Brechas y pastes", tools: ["HIBP", "IntelX", "Hudson Rock"], state: "pending" },
    { name: "Correlación", detail: "Deduplicación y scoring", tools: ["motor Atalaya"], state: "pending" },
    { name: "Reporte de postura", detail: "Resumen ejecutivo + hallazgos", tools: ["generador"], state: "pending" }
];

const stateIcon = (state: Step["state"]) => {
    if (state === "done") return <Check size={14} className="text-good" />;
    if (state === "running") return <Loader2 size={14} className="animate-spin text-accent" />;
    return <Circle size={12} className="text-faint" />;
};

export default function ExposurePipelinePage() {
    return (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
            <PageHeader title="Pipeline" subtitle="Orquestación de la cadena de herramientas · García Consulting" />
            <DesignBanner />

            <div className="mt-6 rounded-lg border border-line bg-surface p-6">
                <div className="mb-5 flex items-center justify-between">
                    <div>
                        <p className="text-[0.9rem] font-semibold">Ejecución #128</p>
                        <p className="text-[0.78rem] text-faint">garciaconsulting.com.mx · iniciada hace 3 min</p>
                    </div>
                    <span className="rounded-md bg-accent/10 px-2.5 py-1 text-[0.78rem] font-semibold text-accent">4 / 8 etapas</span>
                </div>

                <div className="relative flex flex-col">
                    {STEPS.map((step, i) => (
                        <div key={step.name} className="flex gap-4">
                            {/* rail */}
                            <div className="flex flex-col items-center">
                                <span className={[
                                    "flex h-7 w-7 flex-none items-center justify-center rounded-full border",
                                    step.state === "done" ? "border-good/40 bg-good/10"
                                        : step.state === "running" ? "border-accent/40 bg-accent/10"
                                            : "border-line-2 bg-surface-2"
                                ].join(" ")}>
                                    {stateIcon(step.state)}
                                </span>
                                {i < STEPS.length - 1 && (
                                    <span className={["w-px flex-1", step.state === "done" ? "bg-good/30" : "bg-line-2"].join(" ")} style={{ minHeight: 26 }} />
                                )}
                            </div>

                            {/* contenido */}
                            <div className="flex-1 pb-6">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <p className={["text-[0.9rem] font-medium", step.state === "pending" ? "text-muted" : ""].join(" ")}>{step.name}</p>
                                    {step.found && (
                                        <span className={[
                                            "text-[0.76rem] font-semibold",
                                            step.state === "running" ? "text-accent" : "text-good"
                                        ].join(" ")}>{step.found}</span>
                                    )}
                                </div>
                                <p className="text-[0.78rem] text-faint">{step.detail}</p>
                                <div className="mt-2 flex flex-wrap gap-1.5">
                                    {step.tools.map((t) => (
                                        <span key={t} className="rounded bg-surface-2 px-1.5 py-0.5 font-mono text-[0.7rem] text-muted">{t}</span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </motion.div>
    );
}
