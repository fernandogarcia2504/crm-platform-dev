import React from "react";

interface PageHeaderProps {
    title: string;
    subtitle?: string;
    count?: number | string;
    actions?: React.ReactNode;
}

export default function PageHeader({ title, subtitle, count, actions }: PageHeaderProps) {
    return (
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-5 pt-9">
            <div className="min-w-0">
                <div className="flex items-center gap-2.5">
                    <h1 className="text-[1.35rem] font-semibold tracking-tight">{title}</h1>
                    {count !== undefined && (
                        <span className="tnum rounded-full bg-surface-2 px-2 py-0.5 text-[0.72rem] font-semibold text-muted">
                            {count}
                        </span>
                    )}
                </div>
                {subtitle && <p className="mt-1 text-[0.85rem] text-muted">{subtitle}</p>}
            </div>
            {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
    );
}
