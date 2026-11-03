type Tone = "neutral" | "accent" | "good" | "warn" | "danger" | "info" | "purple";

const tones: Record<Tone, string> = {
    neutral: "text-muted bg-surface-2",
    accent: "text-accent bg-accent/12",
    good: "text-good bg-good/12",
    warn: "text-warn bg-warn/14",
    danger: "text-danger bg-danger/12",
    info: "text-info bg-info/12",
    purple: "text-purple bg-purple/14"
};

// Mapas de estado -> tono, para mantener consistencia en toda la app.
const statusTone: Record<string, Tone> = {
    // Empresas
    "Prospecto": "neutral",
    "Cliente": "good",
    "Inactivo": "danger",
    // Proyectos
    "Planeacion": "neutral",
    "Planeación": "neutral",
    "Ejecucion": "info",
    "Ejecución": "info",
    "Cierre": "warn",
    "Cerrado": "good",
    // Oportunidades (etapas típicas)
    "Nuevo": "neutral",
    "Contactado": "info",
    "Propuesta": "warn",
    "Negociacion": "purple",
    "Negociación": "purple",
    "Ganado": "good",
    "Perdido": "danger"
};

interface BadgeProps {
    children: React.ReactNode;
    tone?: Tone;
    dot?: boolean;
}

export default function Badge({ children, tone = "neutral", dot = true }: BadgeProps) {
    return (
        <span
            className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[0.76rem] font-semibold ${tones[tone]}`}
        >
            {dot && <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />}
            {children}
        </span>
    );
}

export function StatusBadge({ status }: { status: string }) {
    return <Badge tone={statusTone[status] ?? "neutral"}>{status}</Badge>;
}
