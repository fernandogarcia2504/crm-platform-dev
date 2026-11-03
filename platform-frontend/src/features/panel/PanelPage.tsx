import { useContext } from "react";
import { useNavigate } from "react-router-dom";

import { motion } from "framer-motion";
import { Radar, GraduationCap, Search, Gauge, ArrowUpRight } from "lucide-react";

import PageHeader from "../../components/ui/PageHeader";
import { ClientContext } from "../../app/context/ClientContext";

type LineCard = {
    title: string;
    desc: string;
    status: string;
    statusTone: string;
    icon: React.ReactNode;
    to?: string;
};

export default function PanelPage() {
    const navigate = useNavigate();
    const clientCtx = useContext(ClientContext);

    const lines: LineCard[] = [
        {
            title: "Exposición · EASM",
            desc: "Monitoreo de superficie de ataque y reporte de postura.",
            status: "En diseño",
            statusTone: "text-warn bg-warn/15",
            icon: <Radar size={20} />,
            to: "/exposicion"
        },
        {
            title: "Concientización",
            desc: "Campañas de phishing + curso para colaboradores.",
            status: "Activa",
            statusTone: "text-good bg-good/15",
            icon: <GraduationCap size={20} />,
            to: "/concientizacion/empleados"
        },
        {
            title: "Investigación y DD",
            desc: "Debida diligencia e investigación corporativa.",
            status: "Próximamente",
            statusTone: "text-faint bg-surface-2",
            icon: <Search size={20} />
        },
        {
            title: "Evaluación de riesgos",
            desc: "Matriz y tratamiento de riesgos.",
            status: "Próximamente",
            statusTone: "text-faint bg-surface-2",
            icon: <Gauge size={20} />
        }
    ];

    return (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
            <PageHeader
                title="Panel"
                subtitle={clientCtx?.client ? `Operando: ${clientCtx.client.companyName}` : "Operación de las líneas de negocio"}
            />

            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                {lines.map((line) => (
                    <button
                        key={line.title}
                        onClick={() => line.to && navigate(line.to)}
                        disabled={!line.to}
                        className={[
                            "flex flex-col gap-3 rounded-lg border border-line bg-surface p-5 text-left transition-colors",
                            line.to ? "hover:border-accent/50 cursor-pointer" : "opacity-70 cursor-default"
                        ].join(" ")}
                    >
                        <div className="flex items-start justify-between">
                            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-2 text-accent">
                                {line.icon}
                            </span>
                            <span className={`rounded-md px-2 py-0.5 text-[0.72rem] font-semibold ${line.statusTone}`}>
                                {line.status}
                            </span>
                        </div>
                        <div>
                            <div className="flex items-center gap-1.5">
                                <p className="text-[1rem] font-semibold">{line.title}</p>
                                {line.to && <ArrowUpRight size={15} className="text-faint" />}
                            </div>
                            <p className="mt-1 text-[0.85rem] text-muted">{line.desc}</p>
                        </div>
                    </button>
                ))}
            </div>

            <div className="mt-6 rounded-lg border border-dashed border-line-2 bg-surface/50 p-4">
                <p className="text-[0.82rem] text-muted">
                    Las líneas operan por separado y se enlazan al cliente del CRM por <code className="text-ink">crmCompanyId</code>.
                    La gestión comercial (empresas, oportunidades, proyectos) vive en el CRM.
                </p>
            </div>
        </motion.div>
    );
}
