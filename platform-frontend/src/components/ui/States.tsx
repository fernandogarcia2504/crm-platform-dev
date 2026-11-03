import React from "react";

export function Spinner({ label }: { label?: string }) {
    return (
        <div className="flex items-center gap-2.5 py-10 text-[0.85rem] text-muted">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-line-2 border-t-accent" />
            {label ?? "Cargando..."}
        </div>
    );
}

export function ErrorText({ children }: { children: React.ReactNode }) {
    return (
        <div className="my-4 rounded-md border border-danger/30 bg-danger/10 px-3.5 py-2.5 text-[0.85rem] text-danger">
            {children}
        </div>
    );
}

interface EmptyStateProps {
    title: string;
    hint?: string;
    icon?: React.ReactNode;
    action?: React.ReactNode;
}

export function EmptyState({ title, hint, icon, action }: EmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-line-2 py-16 text-center">
            {icon && <div className="text-faint">{icon}</div>}
            <div>
                <p className="text-[0.95rem] font-semibold">{title}</p>
                {hint && <p className="mt-1 text-[0.82rem] text-muted">{hint}</p>}
            </div>
            {action}
        </div>
    );
}
