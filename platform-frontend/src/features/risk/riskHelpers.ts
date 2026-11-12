import type { Level } from "./types";

// Constantes y utilidades compartidas (fuera de los .tsx para que Fast Refresh
// solo vea componentes en esos archivos).

export const input =
    "w-full rounded-md border border-line-2 bg-surface-2 px-3 py-2 text-[0.86rem] outline-none focus:border-accent";

export const levelTone: Record<Level, "danger" | "warn" | "good"> = { Alto: "danger", Medio: "warn", Bajo: "good" };

export const levelBg: Record<Level, string> = {
    Alto: "bg-danger/25 border-danger/40",
    Medio: "bg-warn/20 border-warn/40",
    Bajo: "bg-good/18 border-good/35"
};

export const assessmentTone = {
    "Planeada": "neutral",
    "En curso": "info",
    "Tratamiento": "warn",
    "Completada": "good"
} as const;

export const errMsg = (e: unknown, fallback: string) => (e instanceof Error ? e.message : fallback);
