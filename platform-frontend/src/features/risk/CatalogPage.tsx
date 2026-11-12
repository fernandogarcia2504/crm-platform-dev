import { useEffect, useMemo, useState } from "react";

import { motion } from "framer-motion";

import PageHeader from "../../components/ui/PageHeader";
import Badge from "../../components/ui/Badge";
import { Spinner, ErrorText } from "../../components/ui/States";
import type { Catalogs } from "./types";
import { getCatalogs } from "./services";
import { Tabs } from "./RiskUi";
import { input, errMsg } from "./riskHelpers";

// Consulta de los catálogos de la metodología: controles del Anexo A de
// ISO/IEC 27001:2022, amenazas y vulnerabilidades (ISO/IEC 27005) y fuentes
// de riesgo. No depende del cliente seleccionado.

type TabKey = "controles" | "amenazas" | "vulnerabilidades" | "fuentes";

const CID: Record<string, string> = { C: "Confidencialidad", I: "Integridad", D: "Disponibilidad" };

export default function CatalogPage() {
    const [catalogs, setCatalogs] = useState<Catalogs | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [tab, setTab] = useState<TabKey>("controles");
    const [q, setQ] = useState("");

    useEffect(() => {
        getCatalogs().then(setCatalogs).catch((e) => setError(errMsg(e, "Error al cargar catálogos")));
    }, []);

    // Control -> vulnerabilidades que lo sugieren (relación inversa)
    const vulnsByControl = useMemo(() => {
        const map: Record<string, string[]> = {};
        catalogs?.vulnerabilities.forEach((v) =>
            v.suggestedControls.forEach((c) => { (map[c] = map[c] || []).push(v.name); })
        );
        return map;
    }, [catalogs]);

    const match = (...parts: (string | undefined)[]) =>
        parts.join(" ").toLowerCase().includes(q.trim().toLowerCase());

    if (error) return <ErrorText>{error}</ErrorText>;
    if (!catalogs) return <Spinner label="Cargando catálogos..." />;

    const controlName = (code: string) => catalogs.controls.find((c) => c.code === code)?.name ?? "";

    const group = <T,>(items: T[], key: (i: T) => string) => items.reduce<Record<string, T[]>>((acc, i) => {
        (acc[key(i)] = acc[key(i)] || []).push(i);
        return acc;
    }, {});

    const controls = catalogs.controls.filter((c) => match(c.code, c.name, c.nameEn));
    const threats = catalogs.threats.filter((t) => match(t.code, t.name, t.group));
    const vulns = catalogs.vulnerabilities.filter((v) => match(v.code, v.name, v.assetType, ...v.suggestedControls));
    const sources = catalogs.riskSources.filter((s) => match(s.name, s.type, s.description));
    const ends = catalogs.desiredEndStates.filter((s) => match(s.name, s.description));

    return (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
            <PageHeader
                title="Catálogo ISO 27001"
                subtitle="Controles del Anexo A (ISO/IEC 27001:2022) y catálogo de riesgos (ISO/IEC 27005:2022)"
                actions={<input className={`${input} w-[260px]`} placeholder="Buscar en el catálogo..." value={q} onChange={(e) => setQ(e.target.value)} />}
            />

            <Tabs<TabKey>
                active={tab}
                onChange={setTab}
                tabs={[
                    { key: "controles", label: "Controles Anexo A", count: controls.length },
                    { key: "amenazas", label: "Amenazas", count: threats.length },
                    { key: "vulnerabilidades", label: "Vulnerabilidades", count: vulns.length },
                    { key: "fuentes", label: "Fuentes de riesgo", count: sources.length + ends.length }
                ]}
            />

            {/* ---------- Controles ---------- */}
            {tab === "controles" && (
                <div className="mt-5 space-y-6">
                    <p className="text-[0.8rem] text-muted">
                        93 controles en 4 temas. Los marcados <span className="font-semibold text-purple">2022</span> son nuevos en esta versión.
                        Debajo de cada control aparecen las vulnerabilidades del catálogo que lo sugieren como tratamiento.
                    </p>
                    {Object.entries(group(controls, (c) => `${c.theme}|${c.themeName}`)).map(([k, list]) => {
                        const [num, name] = k.split("|");
                        return (
                            <section key={k}>
                                <h3 className="mb-2 text-[0.8rem] font-semibold uppercase tracking-[0.06em] text-faint">
                                    {num}. Controles {name.toLowerCase()} · {list.length}
                                </h3>
                                <div className="overflow-hidden rounded-lg border border-line">
                                    {list.map((c) => (
                                        <div key={c.code} className="grid grid-cols-[72px_1fr] gap-3 border-t border-line px-3 py-2.5 first:border-t-0">
                                            <span className="tnum text-[0.82rem] text-muted">{c.code}</span>
                                            <div className="min-w-0">
                                                <p className="text-[0.86rem]">
                                                    {c.name}
                                                    {c.newIn2022 && <span className="ml-1.5 rounded bg-purple/14 px-1 text-[0.62rem] font-semibold text-purple">2022</span>}
                                                </p>
                                                <p className="text-[0.72rem] text-faint">{c.nameEn}</p>
                                                {vulnsByControl[c.code] && (
                                                    <p className="mt-1 text-[0.72rem] text-muted">
                                                        Trata: {vulnsByControl[c.code].join(" · ")}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        );
                    })}
                </div>
            )}

            {/* ---------- Amenazas ---------- */}
            {tab === "amenazas" && (
                <div className="mt-5 space-y-6">
                    <p className="text-[0.8rem] text-muted">
                        Origen: Accidental, Deliberada o Ambiental. Afecta: C = confidencialidad, I = integridad, D = disponibilidad.
                    </p>
                    {Object.entries(group(threats, (t) => t.group)).map(([g, list]) => (
                        <section key={g}>
                            <h3 className="mb-2 text-[0.8rem] font-semibold uppercase tracking-[0.06em] text-faint">{g} · {list.length}</h3>
                            <div className="overflow-hidden rounded-lg border border-line">
                                {list.map((t) => (
                                    <div key={t.code} className="flex flex-wrap items-center gap-3 border-t border-line px-3 py-2.5 first:border-t-0">
                                        <span className="tnum w-[96px] text-[0.78rem] text-faint">{t.code}</span>
                                        <span className="min-w-[220px] flex-1 text-[0.86rem]">{t.name}</span>
                                        <span className="flex gap-1">{t.origin.map((o) => <Badge key={o} dot={false}>{o}</Badge>)}</span>
                                        <span className="flex gap-1">
                                            {t.affects.map((a) => <Badge key={a} tone="info" dot={false}><span title={CID[a]}>{a}</span></Badge>)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </section>
                    ))}
                </div>
            )}

            {/* ---------- Vulnerabilidades ---------- */}
            {tab === "vulnerabilidades" && (
                <div className="mt-5 space-y-6">
                    <p className="text-[0.8rem] text-muted">
                        Debilidades típicas por tipo de activo y los controles del Anexo A sugeridos para tratarlas
                        (son los que aparecen como sugeridos en el editor de riesgo).
                    </p>
                    {Object.entries(group(vulns, (v) => v.assetType)).map(([g, list]) => (
                        <section key={g}>
                            <h3 className="mb-2 text-[0.8rem] font-semibold uppercase tracking-[0.06em] text-faint">{g} · {list.length}</h3>
                            <div className="overflow-hidden rounded-lg border border-line">
                                {list.map((v) => (
                                    <div key={v.code} className="grid grid-cols-1 gap-2 border-t border-line px-3 py-2.5 first:border-t-0 md:grid-cols-[96px_1fr_1.2fr]">
                                        <span className="tnum text-[0.78rem] text-faint">{v.code}</span>
                                        <span className="text-[0.86rem]">{v.name}</span>
                                        <div className="flex flex-wrap gap-1">
                                            {v.suggestedControls.map((c) => (
                                                <span key={c} title={controlName(c)} className="rounded-md bg-accent/12 px-1.5 py-0.5 text-[0.72rem] text-ink">
                                                    {c} {controlName(c)}
                                                </span>
                                            ))}
                                            {v.clauses && <span className="text-[0.72rem] text-muted">Cláusulas {v.clauses.join(", ")} (gestión de riesgos del SGSI)</span>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    ))}
                </div>
            )}

            {/* ---------- Fuentes y objetivos ---------- */}
            {tab === "fuentes" && (
                <div className="mt-5 grid grid-cols-1 gap-6 xl:grid-cols-2">
                    <section>
                        <h3 className="mb-2 text-[0.8rem] font-semibold uppercase tracking-[0.06em] text-faint">Fuentes de riesgo · {sources.length}</h3>
                        <div className="overflow-hidden rounded-lg border border-line">
                            {sources.map((s) => (
                                <div key={s.code} className="border-t border-line px-3 py-2.5 first:border-t-0">
                                    <div className="flex items-center justify-between gap-2">
                                        <p className="text-[0.86rem] font-medium">{s.name}</p>
                                        <Badge dot={false}>{s.type}</Badge>
                                    </div>
                                    <p className="mt-0.5 text-[0.78rem] text-muted">{s.description}</p>
                                </div>
                            ))}
                        </div>
                    </section>
                    <section>
                        <h3 className="mb-2 text-[0.8rem] font-semibold uppercase tracking-[0.06em] text-faint">Objetivos de la fuente (estado final deseado) · {ends.length}</h3>
                        <div className="overflow-hidden rounded-lg border border-line">
                            {ends.map((s) => (
                                <div key={s.code} className="border-t border-line px-3 py-2.5 first:border-t-0">
                                    <p className="text-[0.86rem] font-medium">{s.name}</p>
                                    <p className="mt-0.5 text-[0.78rem] text-muted">{s.description}</p>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>
            )}
        </motion.div>
    );
}
