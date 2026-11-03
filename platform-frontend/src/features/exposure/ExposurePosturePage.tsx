import { motion } from "framer-motion";
import { TrendingUp, Mail, Download } from "lucide-react";

import PageHeader from "../../components/ui/PageHeader";
import Button from "../../components/ui/Button";
import DesignBanner from "./DesignBanner";

const CATS = [
    { label: "Superficie expuesta", score: 72, tone: "bg-warn" },
    { label: "Vulnerabilidades web", score: 61, tone: "bg-danger" },
    { label: "Correo (SPF/DKIM/DMARC)", score: 45, tone: "bg-danger" },
    { label: "Fugas de credenciales", score: 80, tone: "bg-warn" },
    { label: "Cifrado / TLS", score: 88, tone: "bg-good" }
];

const WEEKS = [58, 61, 60, 64, 67, 69, 71];

export default function ExposurePosturePage() {
    return (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
            <PageHeader
                title="Reporte de postura"
                subtitle="Resumen semanal · García Consulting"
                actions={
                    <>
                        <Button variant="secondary" size="sm" icon={<Download size={14} />}>PDF</Button>
                        <Button size="sm" icon={<Mail size={14} />}>Enviar al cliente</Button>
                    </>
                }
            />
            <DesignBanner />

            <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-[300px_minmax(0,1fr)]">
                {/* score */}
                <div className="flex flex-col items-center justify-center rounded-lg border border-line bg-surface p-6">
                    <div className="relative flex h-36 w-36 items-center justify-center">
                        <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
                            <circle cx="60" cy="60" r="52" fill="none" stroke="var(--color-surface-2)" strokeWidth="10" />
                            <circle cx="60" cy="60" r="52" fill="none" stroke="var(--color-accent)" strokeWidth="10"
                                strokeLinecap="round" strokeDasharray={`${2 * Math.PI * 52}`}
                                strokeDashoffset={`${2 * Math.PI * 52 * (1 - 0.71)}`} />
                        </svg>
                        <div className="absolute text-center">
                            <p className="tnum text-[2rem] font-semibold leading-none">71</p>
                            <p className="text-[0.7rem] text-faint">/ 100</p>
                        </div>
                    </div>
                    <p className="mt-3 text-[0.9rem] font-semibold">Postura general</p>
                    <p className="flex items-center gap-1 text-[0.8rem] text-good"><TrendingUp size={14} /> +2 vs semana previa</p>
                </div>

                {/* categorías + tendencia */}
                <div className="flex flex-col gap-5">
                    <div className="rounded-lg border border-line bg-surface p-5">
                        <h2 className="mb-4 text-[0.95rem] font-semibold">Por categoría</h2>
                        <div className="flex flex-col gap-3">
                            {CATS.map((c) => (
                                <div key={c.label}>
                                    <div className="mb-1 flex items-center justify-between text-[0.82rem]">
                                        <span className="text-muted">{c.label}</span>
                                        <span className="tnum font-medium">{c.score}</span>
                                    </div>
                                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
                                        <div className={`h-full rounded-full ${c.tone}`} style={{ width: `${c.score}%` }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="rounded-lg border border-line bg-surface p-5">
                        <h2 className="mb-4 text-[0.95rem] font-semibold">Tendencia (7 semanas)</h2>
                        <div className="flex h-28 items-end gap-2">
                            {WEEKS.map((v, i) => (
                                <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
                                    <div className="w-full rounded-t bg-accent/70" style={{ height: `${v}%` }} />
                                    <span className="text-[0.66rem] text-faint">S{i + 1}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
