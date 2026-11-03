import { useState } from "react";

import { motion } from "framer-motion";
import { Radar, Play, Globe } from "lucide-react";

import PageHeader from "../../components/ui/PageHeader";
import Button from "../../components/ui/Button";
import Badge from "../../components/ui/Badge";
import DesignBanner from "./DesignBanner";

const FREQUENCIES = ["Semanal", "Quincenal", "Mensual"];

const EVALS = [
    { client: "García Consulting", domain: "garciaconsulting.com.mx", assets: 14, freq: "Semanal", last: "hace 2 d", status: "Activa", tone: "good" as const },
    { client: "SOFOM del Bajío", domain: "sofombajio.mx", assets: 31, freq: "Semanal", last: "hace 5 d", status: "Activa", tone: "good" as const },
    { client: "Despacho Fénix", domain: "fenixlegal.mx", assets: 8, freq: "Mensual", last: "hace 1 mes", status: "Pausada", tone: "warn" as const }
];

export default function ExposurePage() {
    const [freq, setFreq] = useState("Semanal");

    return (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
            <PageHeader title="Exposición · EASM" subtitle="Monitoreo continuo de superficie de ataque" count={EVALS.length} />
            <DesignBanner />

            <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-[360px_minmax(0,1fr)]">
                {/* formulario: llenar campos -> correr todo */}
                <div className="rounded-lg border border-line bg-surface p-5">
                    <div className="mb-4 flex items-center gap-2">
                        <Radar size={16} className="text-accent" />
                        <h2 className="text-[0.95rem] font-semibold">Nueva evaluación</h2>
                    </div>

                    <div className="flex flex-col gap-3.5">
                        <Field label="Cliente">
                            <input className={inputCls} placeholder="García Consulting" />
                        </Field>
                        <Field label="Dominio raíz">
                            <input className={inputCls} placeholder="garciaconsulting.com.mx" />
                        </Field>
                        <Field label="Correos a monitorear">
                            <input className={inputCls} placeholder="nando@garciaconsulting.com.mx" />
                        </Field>
                        <Field label="Alcance adicional (IPs, subdominios)">
                            <input className={inputCls} placeholder="203.0.113.0/24, api.*" />
                        </Field>
                        <Field label="Frecuencia">
                            <div className="flex gap-2">
                                {FREQUENCIES.map((f) => (
                                    <button
                                        key={f}
                                        onClick={() => setFreq(f)}
                                        className={[
                                            "flex-1 rounded-md border px-2 py-1.5 text-[0.8rem] font-medium transition-colors",
                                            freq === f ? "border-accent bg-accent/10 text-ink" : "border-line-2 text-muted hover:text-ink"
                                        ].join(" ")}
                                    >
                                        {f}
                                    </button>
                                ))}
                            </div>
                        </Field>

                        <Button icon={<Play size={15} />} className="mt-1 w-full">
                            Correr evaluación
                        </Button>
                        <p className="text-center text-[0.72rem] text-faint">
                            Al correr, se ejecuta toda la cadena de herramientas automáticamente.
                        </p>
                    </div>
                </div>

                {/* evaluaciones activas */}
                <div className="rounded-lg border border-line overflow-hidden self-start">
                    <div className="grid grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_80px_minmax(0,1fr)] border-b border-line bg-surface px-4 py-2.5 text-[0.7rem] font-semibold uppercase tracking-[0.04em] text-faint">
                        <p>Cliente</p><p>Frecuencia</p><p className="text-right">Assets</p><p className="text-right">Estado</p>
                    </div>
                    <div className="divide-y divide-line">
                        {EVALS.map((e) => (
                            <div key={e.domain} className="grid grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_80px_minmax(0,1fr)] items-center px-4 py-3 hover:bg-surface-2/50">
                                <div className="flex items-center gap-2.5 min-w-0">
                                    <span className="flex h-8 w-8 flex-none items-center justify-center rounded-lg bg-surface-2 text-faint">
                                        <Globe size={15} />
                                    </span>
                                    <div className="min-w-0">
                                        <p className="truncate text-[0.88rem] font-medium">{e.client}</p>
                                        <p className="truncate text-[0.74rem] text-faint">{e.domain}</p>
                                    </div>
                                </div>
                                <p className="text-[0.84rem] text-muted">{e.freq}</p>
                                <p className="tnum text-right text-[0.88rem]">{e.assets}</p>
                                <div className="flex justify-end"><Badge tone={e.tone}>{e.status}</Badge></div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

const inputCls = "w-full rounded-md border border-line-2 bg-surface-2 px-3 py-2 text-[0.88rem] outline-none focus:border-accent";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <label className="flex flex-col gap-1.5">
            <span className="text-[0.78rem] text-muted">{label}</span>
            {children}
        </label>
    );
}
