import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { motion } from "framer-motion";
import { ChevronLeft } from "lucide-react";

import Badge from "../../components/ui/Badge";
import { Spinner, ErrorText } from "../../components/ui/States";
import type { AssessmentDetail, Catalogs } from "./types";
import { getAssessment, getCatalogs } from "./services";
import { Tabs, Metric } from "./RiskUi";
import { errMsg, assessmentTone } from "./riskHelpers";
import RisksTab from "./RisksTab";
import AssetsTab from "./AssetsTab";
import HeatmapTab from "./HeatmapTab";
import SoaTab from "./SoaTab";
import OpportunitiesTab from "./OpportunitiesTab";
import SettingsTab from "./SettingsTab";

type TabKey = "riesgos" | "activos" | "mapa" | "soa" | "oportunidades" | "evaluacion";

export default function RiskAssessmentDetailPage() {
    const { assessmentId } = useParams();
    const navigate = useNavigate();

    const [data, setData] = useState<AssessmentDetail | null>(null);
    const [catalogs, setCatalogs] = useState<Catalogs | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [tab, setTab] = useState<TabKey>("riesgos");
    const [refreshKey, setRefreshKey] = useState(0);

    const load = useCallback(async () => {
        if (!assessmentId) return;
        try {
            const [detail, cats] = await Promise.all([getAssessment(assessmentId), getCatalogs()]);
            setError(null);
            setData(detail);
            setCatalogs(cats);
            setRefreshKey((k) => k + 1);
        } catch (e) {
            setError(errMsg(e, "Error al cargar la evaluación"));
        }
    }, [assessmentId]);

    useEffect(() => {
        load().finally(() => setLoading(false));
    }, [load]);

    if (loading && !data) return <Spinner label="Cargando evaluación..." />;
    if (error && !data) return <ErrorText>{error}</ErrorText>;
    if (!data || !catalogs) return null;

    const { assessment, assets, risks, opportunities, summary } = data;
    // La evaluación usa su metodología congelada; si no la trae, la vigente.
    const methodology = assessment.methodology ?? catalogs.methodology;

    return (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
            <div className="pt-7">
                <button onClick={() => navigate("/riesgos")} className="mb-3 flex items-center gap-1 text-[0.8rem] text-muted hover:text-ink">
                    <ChevronLeft size={15} /> Evaluaciones
                </button>
                <div className="flex flex-wrap items-start justify-between gap-4 border-b border-line pb-5">
                    <div className="min-w-0">
                        <div className="flex items-center gap-2.5">
                            <h1 className="text-[1.35rem] font-semibold tracking-tight">{assessment.name}</h1>
                            <Badge tone={assessmentTone[assessment.status]}>{assessment.status}</Badge>
                        </div>
                        <p className="mt-1 text-[0.85rem] text-muted">
                            {assessment.companyName}
                            {assessment.crmProjectName && <> · Proyecto CRM: {assessment.crmProjectName}</>}
                            {" "}· {assessment.framework} · Apetito: {assessment.acceptanceLevel}
                        </p>
                    </div>
                    <div className="grid grid-cols-5 gap-2">
                        <Metric label="Activos" value={assets.length} />
                        <Metric label="Riesgos" value={summary.totalRisks} />
                        <Metric label="Altos (inherente)" value={summary.inherentByLevel.Alto} tone="text-danger" />
                        <Metric label="Fuera de apetito" value={summary.outsideAppetite} tone="text-warn" />
                        <Metric label="Tratamientos" value={`${summary.treatments.implemented}/${summary.treatments.total}`} tone="text-good" />
                    </div>
                </div>
            </div>

            {error && <ErrorText>{error}</ErrorText>}

            <Tabs<TabKey>
                active={tab}
                onChange={setTab}
                tabs={[
                    { key: "riesgos", label: "Riesgos", count: risks.length },
                    { key: "activos", label: "Activos", count: assets.length },
                    { key: "mapa", label: "Mapa de calor" },
                    { key: "soa", label: "Declaración de aplicabilidad" },
                    { key: "oportunidades", label: "Oportunidades", count: opportunities.length },
                    { key: "evaluacion", label: "Evaluación" }
                ]}
            />

            {tab === "riesgos" && (
                <RisksTab
                    assessmentId={assessment._id}
                    methodology={methodology}
                    acceptanceLevel={assessment.acceptanceLevel}
                    catalogs={catalogs}
                    assets={assets}
                    risks={risks}
                    onChanged={load}
                />
            )}
            {tab === "activos" && (
                <AssetsTab assessmentId={assessment._id} methodology={methodology} assets={assets} risks={risks} onChanged={load} />
            )}
            {tab === "mapa" && <HeatmapTab methodology={methodology} risks={risks} />}
            {tab === "soa" && <SoaTab assessment={assessment} refreshKey={refreshKey} onChanged={load} />}
            {tab === "oportunidades" && (
                <OpportunitiesTab
                    assessmentId={assessment._id}
                    methodology={methodology}
                    assets={assets}
                    opportunities={opportunities}
                    onChanged={load}
                />
            )}
            {tab === "evaluacion" && (
                <SettingsTab key={refreshKey} assessment={assessment} methodology={methodology} onChanged={load} />
            )}
        </motion.div>
    );
}
