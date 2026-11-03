import PhishingCampaign from "../models/phishingCampaign.model.js";
import Employee from "../models/employee.model.js";
import {
    isGophishEnabled,
    upsertGroup,
    launchCampaign as launchGophishCampaign,
    getCampaignResults
} from "../services/gophish.service.js";

const TARGET_EVENTS = ["sent", "opened", "clicked", "submittedData", "reported"];
const EVENT_TIMESTAMP_FIELD = {
    sent: "sentAt",
    opened: "openedAt",
    clicked: "clickedAt",
    submittedData: "submittedAt",
    reported: "reportedAt"
};

// Embudo: enviados -> abiertos -> clic -> enviaron datos -> reportaron,
// más tasas de clic y de reporte (reporte = KPI de concientización).
const calculateMetrics = (targets) => {

    const totalTargets = targets.length;
    const sent = targets.filter((t) => t.sent).length;
    const opened = targets.filter((t) => t.opened).length;
    const clicked = targets.filter((t) => t.clicked).length;
    const submittedData = targets.filter((t) => t.submittedData).length;
    const reported = targets.filter((t) => t.reported).length;

    return {
        totalTargets,
        sent,
        opened,
        clicked,
        submittedData,
        reported,
        clickRate: sent ? Math.round((clicked / sent) * 100) : 0,
        reportRate: sent ? Math.round((reported / sent) * 100) : 0
    };
};

const serializeCampaign = (campaign) => ({
    ...campaign.toObject(),
    metrics: calculateMetrics(campaign.targets)
});


// CREAR UNA CAMPAÑA (sobre empleados ya cargados de la empresa)
export const createCampaign = async (req, res) => {

    try {

        const {
            crmCompanyId, companyName, crmProjectId,
            name, emailTemplate, landingPage, sendingProfile, senderDomain,
            campaignUrl, launchDate, gophishCampaignId, notes, employeeIds
        } = req.body;

        if (!crmCompanyId || !companyName) {
            return res.status(400).json({ message: "Se requiere la empresa (crmCompanyId y companyName)" });
        }

        if (!name) {
            return res.status(400).json({ message: "El nombre de la campaña es requerido" });
        }

        if (!Array.isArray(employeeIds) || employeeIds.length === 0) {
            return res.status(400).json({ message: "Se requiere al menos un empleado como objetivo" });
        }

        const employees = await Employee.find({ _id: { $in: employeeIds }, crmCompanyId });

        if (employees.length === 0) {
            return res.status(404).json({
                message: "Ninguno de los empleados indicados pertenece a esta empresa"
            });
        }

        const campaign = await PhishingCampaign.create({
            crmCompanyId, companyName, crmProjectId: crmProjectId ?? null,
            name, emailTemplate, landingPage, sendingProfile, senderDomain,
            campaignUrl, launchDate, gophishCampaignId, notes,
            targets: employees.map((e) => ({ employee: e._id }))
        });

        return res.status(201).json({
            message: "Campaña creada exitosamente",
            campaign: serializeCampaign(campaign)
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Error al crear la campaña" });
    }

};


// LISTAR CAMPAÑAS DE UNA EMPRESA (opcional ?crmProjectId= para filtrar)
export const getCampaigns = async (req, res) => {

    try {

        const { crmCompanyId } = req.params;
        const { crmProjectId } = req.query;

        const filter = { crmCompanyId };
        if (crmProjectId) filter.crmProjectId = crmProjectId;

        const campaigns = await PhishingCampaign.find(filter).sort({ createdAt: -1 });

        return res.status(200).json({ campaigns: campaigns.map(serializeCampaign) });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Error al obtener las campañas" });
    }

};


// OBTENER UNA CAMPAÑA (con el detalle de cada objetivo)
export const getCampaign = async (req, res) => {

    try {

        const { campaignId } = req.params;

        const campaign = await PhishingCampaign
            .findById(campaignId)
            .populate("targets.employee", "fullName email position sector");

        if (!campaign) {
            return res.status(404).json({ message: "La campaña no existe" });
        }

        return res.status(200).json({ campaign: serializeCampaign(campaign) });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Error al obtener la campaña" });
    }

};


// ACTUALIZAR DATOS GENERALES
export const updateCampaign = async (req, res) => {

    try {

        const { campaignId } = req.params;
        const fields = [
            "name", "emailTemplate", "landingPage", "sendingProfile", "senderDomain",
            "campaignUrl", "launchDate", "status", "gophishCampaignId", "notes"
        ];

        const campaign = await PhishingCampaign.findById(campaignId);

        if (!campaign) {
            return res.status(404).json({ message: "La campaña no existe" });
        }

        for (const field of fields) {
            if (req.body[field] !== undefined) campaign[field] = req.body[field];
        }

        await campaign.save();

        return res.status(200).json({
            message: "Campaña actualizada correctamente",
            campaign: serializeCampaign(campaign)
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Error al actualizar la campaña" });
    }

};


// ACTUALIZAR EL EVENTO DE UN OBJETIVO (captura manual, o webhook futuro)
export const updateTargetEvent = async (req, res) => {

    try {

        const { campaignId, targetId } = req.params;
        const { event, value, at } = req.body;

        if (!TARGET_EVENTS.includes(event)) {
            return res.status(400).json({ message: `El evento debe ser uno de: ${TARGET_EVENTS.join(", ")}` });
        }

        const campaign = await PhishingCampaign.findById(campaignId);

        if (!campaign) {
            return res.status(404).json({ message: "La campaña no existe" });
        }

        const target = campaign.targets.id(targetId);

        if (!target) {
            return res.status(404).json({ message: "El objetivo no existe en esta campaña" });
        }

        const eventValue = value !== undefined ? Boolean(value) : true;
        const timestampField = EVENT_TIMESTAMP_FIELD[event];

        target[event] = eventValue;
        target[timestampField] = eventValue ? (at ? new Date(at) : new Date()) : null;

        // Cascada: si se marca un paso posterior, los previos se asumen
        const funnelOrder = ["sent", "opened", "clicked", "submittedData"];
        const stepIndex = funnelOrder.indexOf(event);

        if (eventValue && stepIndex > 0) {
            for (let i = 0; i < stepIndex; i++) {
                const previousStep = funnelOrder[i];
                if (!target[previousStep]) {
                    target[previousStep] = true;
                    target[EVENT_TIMESTAMP_FIELD[previousStep]] = new Date();
                }
            }
        }

        await campaign.save();

        return res.status(200).json({
            message: "Evento actualizado",
            campaign: serializeCampaign(campaign)
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Error al actualizar el evento" });
    }

};


// LANZAR LA CAMPAÑA EN GOPHISH (crea el grupo con los objetivos y lanza)
export const launchCampaign = async (req, res) => {

    try {

        if (!isGophishEnabled()) {
            return res.status(501).json({
                message: "Integración con Gophish no configurada. Define GOPHISH_API_URL y GOPHISH_API_KEY en el .env, o captura los eventos manualmente."
            });
        }

        const { campaignId } = req.params;

        const campaign = await PhishingCampaign
            .findById(campaignId)
            .populate("targets.employee", "fullName email position");

        if (!campaign) {
            return res.status(404).json({ message: "La campaña no existe" });
        }

        if (!campaign.emailTemplate || !campaign.landingPage || !campaign.sendingProfile) {
            return res.status(400).json({
                message: "Faltan datos de Gophish en la campaña: plantilla de correo, landing page y sending profile."
            });
        }

        const employees = campaign.targets
            .map((t) => t.employee)
            .filter(Boolean);

        if (employees.length === 0) {
            return res.status(400).json({ message: "La campaña no tiene objetivos válidos." });
        }

        const groupName = `${campaign.companyName} - ${campaign.name}`.slice(0, 255);

        await upsertGroup(groupName, employees);

        const result = await launchGophishCampaign({
            name: `${campaign.companyName} - ${campaign.name}`.slice(0, 255),
            templateName: campaign.emailTemplate,
            pageName: campaign.landingPage,
            sendingProfileName: campaign.sendingProfile,
            groupName,
            url: campaign.campaignUrl,
            launchDate: campaign.launchDate
        });

        campaign.gophishCampaignId = String(result.id);
        campaign.status = "En curso";
        // Los objetivos quedan como enviados; el resto del embudo se trae
        // con "sincronizar".
        campaign.targets.forEach((t) => {
            if (!t.sent) { t.sent = true; t.sentAt = new Date(); }
        });

        await campaign.save();

        return res.status(200).json({
            message: "Campaña lanzada en Gophish",
            campaign: serializeCampaign(campaign)
        });

    } catch (error) {
        console.error(error);
        return res.status(502).json({ message: error.message || "Error al lanzar la campaña" });
    }

};


// SINCRONIZAR RESULTADOS DESDE GOPHISH hacia el embudo
export const syncCampaignResults = async (req, res) => {

    try {

        if (!isGophishEnabled()) {
            return res.status(501).json({ message: "Integración con Gophish no configurada." });
        }

        const { campaignId } = req.params;

        const campaign = await PhishingCampaign
            .findById(campaignId)
            .populate("targets.employee", "email");

        if (!campaign) {
            return res.status(404).json({ message: "La campaña no existe" });
        }

        if (!campaign.gophishCampaignId) {
            return res.status(400).json({ message: "La campaña aún no se ha lanzado en Gophish." });
        }

        const data = await getCampaignResults(campaign.gophishCampaignId);
        const results = data.results || [];

        // Rango del embudo según el estado más avanzado reportado por Gophish
        const rank = (status) => {
            const s = (status || "").toLowerCase();
            if (s.includes("submitted")) return 4;
            if (s.includes("clicked")) return 3;
            if (s.includes("opened")) return 2;
            if (s.includes("sent") || s.includes("sending")) return 1;
            return 0;
        };

        const byEmail = new Map(
            results.map((r) => [(r.email || "").toLowerCase(), r])
        );

        const now = new Date();

        for (const target of campaign.targets) {
            const email = (target.employee?.email || "").toLowerCase();
            const r = byEmail.get(email);
            if (!r) continue;

            const level = rank(r.status);

            const setStep = (flag, tsField) => {
                if (!target[flag]) { target[flag] = true; target[tsField] = now; }
            };

            if (level >= 1) setStep("sent", "sentAt");
            if (level >= 2) setStep("opened", "openedAt");
            if (level >= 3) setStep("clicked", "clickedAt");
            if (level >= 4) setStep("submittedData", "submittedAt");
            if (r.reported) setStep("reported", "reportedAt");
        }

        await campaign.save();

        return res.status(200).json({
            message: "Resultados sincronizados",
            campaign: serializeCampaign(campaign)
        });

    } catch (error) {
        console.error(error);
        return res.status(502).json({ message: error.message || "Error al sincronizar" });
    }

};


// ELIMINAR UNA CAMPAÑA
export const deleteCampaign = async (req, res) => {

    try {

        const campaign = await PhishingCampaign.findByIdAndDelete(req.params.campaignId);

        if (!campaign) {
            return res.status(404).json({ message: "La campaña no existe" });
        }

        return res.status(200).json({ message: "Campaña eliminada correctamente" });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Error al eliminar la campaña" });
    }

};
