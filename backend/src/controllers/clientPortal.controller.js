import bcrypt from "bcrypt";

import ClientAccount from "../models/clientAccount.model.js";
import PhishingCampaign from "../models/phishingCampaign.model.js";

// Portal de cliente (solo lectura). El contacto ve el avance GENERAL de las
// campañas de concientización de su empresa: embudo agregado y tendencia
// entre campañas. Sin nombres de empleados ni desglose por sector.

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
        openRate: Math.round((opened / base) * 100),
        clickRate: Math.round((clicked / base) * 100),
        submitRate: Math.round((submitted / base) * 100),
        reportRate: Math.round((reported / base) * 100)
    };
};

// GET /api/client-portal/me
export const getMe = async (req, res) => {
    try {
        const account = await ClientAccount.findById(req.client.id)
            .select("fullName email companyName position mustChangePassword");
        if (!account) {
            return res.status(404).json({ message: "La cuenta no existe" });
        }
        return res.status(200).json({
            account: {
                id: account._id,
                fullName: account.fullName,
                email: account.email,
                company: account.companyName,
                position: account.position,
                mustChangePassword: account.mustChangePassword !== false
            }
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Error al obtener la cuenta" });
    }
};

// GET /api/client-portal/overview  — embudo agregado + tendencia por campaña
export const getOverview = async (req, res) => {
    try {

        const crmCompanyId = req.client.crmCompanyId;

        // Solo campañas ya lanzadas (En curso / Completada): las Planeadas
        // todavía no tienen resultados que mostrarle al cliente.
        const campaigns = await PhishingCampaign
            .find({ crmCompanyId, status: { $in: ["En curso", "Completada"] } })
            .sort({ launchDate: 1, createdAt: 1 });

        // Embudo agregado de todas las campañas
        const allTargets = campaigns.flatMap((c) => c.targets);
        const overall = funnel(allTargets);

        // Serie por campaña (para la gráfica de tendencia)
        const perCampaign = campaigns.map((c) => {
            const m = funnel(c.targets);
            return {
                id: c._id,
                name: c.name,
                status: c.status,
                launchDate: c.launchDate,
                sent: m.sent,
                openRate: m.openRate,
                clickRate: m.clickRate,
                reportRate: m.reportRate
            };
        });

        // Postura: comparación de la última campaña contra la anterior
        let trend = null;
        if (perCampaign.length >= 2) {
            const last = perCampaign[perCampaign.length - 1];
            const prev = perCampaign[perCampaign.length - 2];
            trend = {
                clickRateDelta: last.clickRate - prev.clickRate,   // negativo = mejora
                reportRateDelta: last.reportRate - prev.reportRate // positivo = mejora
            };
        }

        return res.status(200).json({
            company: campaigns[0]?.companyName || null,
            generatedAt: new Date(),
            totals: {
                campaigns: campaigns.length,
                peopleReached: overall.total
            },
            overall,
            perCampaign,
            trend
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Error al generar el resumen" });
    }
};

// POST /api/client-portal/change-password
export const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: "Contraseña actual y nueva son requeridas" });
        }
        if (newPassword.length < 8) {
            return res.status(400).json({ message: "La nueva contraseña debe tener al menos 8 caracteres" });
        }

        const account = await ClientAccount.findById(req.client.id);
        if (!account) {
            return res.status(404).json({ message: "La cuenta no existe" });
        }

        const correct = await bcrypt.compare(currentPassword, account.passwordHash);
        if (!correct) {
            return res.status(401).json({ message: "La contraseña actual no es correcta" });
        }

        account.passwordHash = await bcrypt.hash(newPassword, 10);
        account.mustChangePassword = false;
        await account.save();

        return res.status(200).json({ message: "Contraseña actualizada correctamente" });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Error al cambiar la contraseña" });
    }
};
