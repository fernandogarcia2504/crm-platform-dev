import mongoose from "mongoose";

// Un target = un Employee dentro de una campaña puntual. Se registra el
// embudo completo (enviado -> abierto -> clic -> envío de datos ->
// reportado), porque "reportado" es el KPI que mide si la concientización
// está funcionando.
const PhishingTargetSchema = new mongoose.Schema({

    employee: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Employee",
        required: true
    },

    sent: { type: Boolean, default: false },
    sentAt: Date,

    opened: { type: Boolean, default: false },
    openedAt: Date,

    clicked: { type: Boolean, default: false },
    clickedAt: Date,

    submittedData: { type: Boolean, default: false },
    submittedAt: Date,

    reported: { type: Boolean, default: false },
    reportedAt: Date

});

const PhishingCampaignSchema = new mongoose.Schema({

    // --- enlace al CRM (referencia por id, sin acoplamiento) ---
    crmCompanyId: { type: String, required: true, index: true },
    companyName: { type: String, required: true },
    // Proyecto comercial del CRM que originó esta operación (opcional)
    crmProjectId: { type: String, default: null },

    name: { type: String, required: true },

    // Referencia manual a lo que exista del lado de gophish. La
    // integración en vivo está en pausa; por ahora se cruza a mano.
    gophishCampaignId: String,

    emailTemplate: String,
    landingPage: String,
    sendingProfile: String,
    senderDomain: String,
    campaignUrl: String,

    launchDate: Date,

    status: {
        type: String,
        enum: ["Planeada", "En curso", "Completada"],
        default: "Planeada"
    },

    targets: [PhishingTargetSchema],

    notes: String

}, { timestamps: true });

export default mongoose.model("PhishingCampaign", PhishingCampaignSchema);
