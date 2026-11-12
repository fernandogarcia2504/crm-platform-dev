import React from "react";
import { X } from "lucide-react";

import Badge from "../../components/ui/Badge";
import type { Level } from "./types";
import { levelTone } from "./riskHelpers";

// Piezas de UI compartidas por las pantallas de riesgos.


export function LevelBadge({ level, score }: { level?: Level | null; score?: number | null }) {
    if (!level) return <span className="text-[0.78rem] text-faint">—</span>;
    return (
        <span className="whitespace-nowrap">
            <Badge tone={levelTone[level]}>
                {level}
                {score != null && <span className="tnum opacity-75">· {score}</span>}
            </Badge>
        </span>
    );
}

export function Field({ label, hint, children, className = "" }: {
    label: string; hint?: string; children: React.ReactNode; className?: string;
}) {
    return (
        <label className={`block ${className}`}>
            <span className="mb-1 block text-[0.74rem] font-medium text-muted">{label}</span>
            {children}
            {hint && <span className="mt-1 block text-[0.7rem] text-faint">{hint}</span>}
        </label>
    );
}

export function Section({ title, subtitle, children, actions }: {
    title: string; subtitle?: string; children: React.ReactNode; actions?: React.ReactNode;
}) {
    return (
        <section className="rounded-lg border border-line bg-surface p-4">
            <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                    <h4 className="text-[0.9rem] font-semibold">{title}</h4>
                    {subtitle && <p className="mt-0.5 text-[0.76rem] text-muted">{subtitle}</p>}
                </div>
                {actions}
            </div>
            {children}
        </section>
    );
}

export function Modal({ title, onClose, children, footer, wide }: {
    title: string; onClose: () => void; children: React.ReactNode; footer?: React.ReactNode; wide?: boolean;
}) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm" onClick={onClose}>
            <div
                className={`flex max-h-[90vh] w-full flex-col rounded-xl border border-line bg-surface shadow-2xl ${wide ? "max-w-[960px]" : "max-w-[520px]"}`}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
                    <h3 className="text-[1rem] font-semibold">{title}</h3>
                    <button onClick={onClose} aria-label="Cerrar" className="rounded-md p-1 text-faint hover:bg-surface-2 hover:text-ink">
                        <X size={16} />
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
                {footer && <div className="flex justify-end gap-2 border-t border-line px-5 py-3">{footer}</div>}
            </div>
        </div>
    );
}

// Selector 0–3 / 1–3 compacto para probabilidad e impactos
export function ScalePicker({ value, onChange, options }: {
    value: number | undefined;
    onChange: (v: number) => void;
    options: { value: number; label: string; description?: string }[];
}) {
    return (
        <div className="flex gap-1">
            {options.map((o) => (
                <button
                    key={o.value}
                    type="button"
                    title={o.description}
                    onClick={() => onChange(o.value)}
                    className={[
                        "tnum min-w-[2.1rem] rounded-md border px-2 py-1 text-[0.76rem] font-semibold transition-colors",
                        value === o.value
                            ? "border-accent bg-accent/15 text-ink"
                            : "border-line-2 bg-surface-2 text-muted hover:border-faint"
                    ].join(" ")}
                >
                    {o.value}
                </button>
            ))}
        </div>
    );
}

export function Tabs<T extends string>({ tabs, active, onChange }: {
    tabs: { key: T; label: string; count?: number }[]; active: T; onChange: (k: T) => void;
}) {
    return (
        <div className="mt-5 flex gap-1 border-b border-line">
            {tabs.map((t) => (
                <button
                    key={t.key}
                    onClick={() => onChange(t.key)}
                    className={[
                        "-mb-px flex items-center gap-1.5 border-b-2 px-3 py-2 text-[0.84rem] font-medium transition-colors",
                        active === t.key ? "border-accent text-ink" : "border-transparent text-muted hover:text-ink"
                    ].join(" ")}
                >
                    {t.label}
                    {t.count !== undefined && (
                        <span className="tnum rounded-full bg-surface-2 px-1.5 text-[0.68rem] text-faint">{t.count}</span>
                    )}
                </button>
            ))}
        </div>
    );
}

export function Metric({ label, value, tone }: { label: string; value: number | string; tone?: string }) {
    return (
        <div className="rounded-md bg-surface-2 px-2.5 py-2">
            <p className={`tnum text-[1.1rem] font-semibold leading-none ${tone ?? ""}`}>{value}</p>
            <p className="mt-1 truncate text-[0.68rem] text-faint">{label}</p>
        </div>
    );
}
