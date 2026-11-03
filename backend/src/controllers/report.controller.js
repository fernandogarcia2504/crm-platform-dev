import PhishingCampaign from "../models/phishingCampaign.model.js";
import Employee from "../models/employee.model.js";

// Fase 1: el reporte lo generamos y enviamos NOSOTROS (no hay portal de
// cliente todavía). Este endpoint arma el reporte de una campaña: embudo,
// desglose por sector y estado de capacitación. Devuelve JSON + un HTML
// listo para exportar a PDF / enviar por correo.

const funnel = (targets) => {
    const sent = targets.filter((t) => t.sent).length;
    const opened = targets.filter((t) => t.opened).length;
    const clicked = targets.filter((t) => t.clicked).length;
    const submitted = targets.filter((t) => t.submittedData).length;
    const reported = targets.filter((t) => t.reported).length;
    const base = sent || targets.length || 1;
    return {
        total: targets.length,
        sent, opened, clicked, submitted, reported,
        clickRate: Math.round((clicked / base) * 100),
        reportRate: Math.round((reported / base) * 100),
        openRate: Math.round((opened / base) * 100)
    };
};

export const generateCampaignReport = async (req, res) => {

    try {

        const { campaignId } = req.params;

        const campaign = await PhishingCampaign
            .findById(campaignId)
            .populate("targets.employee", "fullName email position sector");

        if (!campaign) {
            return res.status(404).json({ message: "La campaña no existe" });
        }

        const metrics = funnel(campaign.targets);

        // Desglose por sector
        const bySectorMap = new Map();
        for (const t of campaign.targets) {
            const sector = t.employee?.sector || "Sin sector";
            if (!bySectorMap.has(sector)) bySectorMap.set(sector, []);
            bySectorMap.get(sector).push(t);
        }
        const bySector = [...bySectorMap.entries()].map(([sector, targets]) => ({
            sector,
            ...funnel(targets)
        }));

        // Estado de capacitación de los objetivos de la campaña
        const employeeIds = campaign.targets.map((t) => t.employee?._id).filter(Boolean);
        const employees = await Employee.find({ _id: { $in: employeeIds } })
            .select("fullName courseAccount.completed courseAccount.progress");
        const trained = employees.filter((e) => e.courseAccount?.completed).length;

        const report = {
            campaign: {
                id: campaign._id,
                name: campaign.name,
                company: campaign.companyName,
                status: campaign.status,
                launchDate: campaign.launchDate
            },
            generatedAt: new Date(),
            metrics,
            bySector,
            training: {
                total: employees.length,
                completed: trained,
                completionRate: employees.length ? Math.round((trained / employees.length) * 100) : 0
            }
        };

        return res.status(200).json({ report, html: renderReportHtml(report) });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Error al generar el reporte" });
    }

};

// HTML autocontenido (dark) para exportar a PDF o enviar. Sin dependencias.
const renderReportHtml = (r) => {
    const m = r.metrics;
    const date = new Date(r.generatedAt).toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" });
    const rows = r.bySector.map((s) =>
        `<tr><td>${s.sector}</td><td>${s.sent}</td><td>${s.clicked} (${s.clickRate}%)</td><td>${s.reported} (${s.reportRate}%)</td></tr>`
    ).join("");

    return `<!doctype html><html lang="es"><head><meta charset="utf-8">
<title>Reporte — ${r.campaign.name}</title>
<style>
  body{font-family:-apple-system,Segoe UI,Roboto,sans-serif;background:#0d0e11;color:#e7e9ee;margin:0;padding:40px}
  .wrap{max-width:760px;margin:0 auto}
  h1{font-size:22px;margin:0 0 4px} .muted{color:#9aa3b2;font-size:13px}
  .kpis{display:flex;gap:16px;margin:28px 0}
  .kpi{flex:1;border:1px solid #2a2f38;border-radius:10px;padding:16px;background:#15171c}
  .kpi .n{font-size:26px;font-weight:700} .kpi .l{color:#9aa3b2;font-size:12px}
  table{width:100%;border-collapse:collapse;margin-top:10px;font-size:13px}
  th,td{text-align:left;padding:8px 10px;border-bottom:1px solid #2a2f38}
  th{color:#9aa3b2;font-size:11px;text-transform:uppercase;letter-spacing:.04em}
  .accent{color:#5b74ff}
</style></head><body><div class="wrap">
  <p class="accent" style="font-weight:700">ATALAYA</p>
  <h1>Reporte de concientización — ${r.campaign.name}</h1>
  <p class="muted">${r.campaign.company} · ${date}</p>
  <div class="kpis">
    <div class="kpi"><div class="n">${m.sent}</div><div class="l">Correos enviados</div></div>
    <div class="kpi"><div class="n">${m.clickRate}%</div><div class="l">Tasa de clic</div></div>
    <div class="kpi"><div class="n">${m.reportRate}%</div><div class="l">Tasa de reporte</div></div>
    <div class="kpi"><div class="n">${r.training.completionRate}%</div><div class="l">Capacitación completada</div></div>
  </div>
  <h3>Desglose por sector</h3>
  <table><thead><tr><th>Sector</th><th>Enviados</th><th>Clic</th><th>Reportaron</th></tr></thead>
  <tbody>${rows || '<tr><td colspan="4" class="muted">Sin datos</td></tr>'}</tbody></table>
  <p class="muted" style="margin-top:28px">Generado por Atalaya · la tasa de reporte es el indicador que mejor mide la madurez de concientización.</p>
</div></body></html>`;
};
