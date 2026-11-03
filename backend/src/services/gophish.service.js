import axios from "axios";
import https from "https";

// =====================================================================
// Gophish — integración real.
// Base URL en GOPHISH_API_URL (ej. https://192.168.100.124:3333) y API
// key en GOPHISH_API_KEY, ambos en el .env del backend. Si falta alguno,
// isGophishEnabled() es false y los endpoints de lanzar/sincronizar
// responden que la integración no está configurada (modo manual).
// =====================================================================

export const isGophishEnabled = () =>
    Boolean(process.env.GOPHISH_API_URL && process.env.GOPHISH_API_KEY);

const buildClient = () => {

    const baseUrl = process.env.GOPHISH_API_URL;
    const apiKey = process.env.GOPHISH_API_KEY;

    if (!baseUrl) throw new Error("Falta GOPHISH_API_URL en el backend (.env)");
    if (!apiKey) throw new Error("Falta GOPHISH_API_KEY en el backend (.env)");

    return axios.create({
        baseURL: `${baseUrl.replace(/\/+$/, "")}/api`,
        timeout: 15000,
        headers: { "Authorization": `Bearer ${apiKey}` },
        // Gophish suele correr con certificado autofirmado (IP local o
        // túnel sin TLS propio). Se acepta solo para este cliente.
        httpsAgent: new https.Agent({ rejectUnauthorized: false })
    });
};

const unwrapError = (error) => {
    if (error.response) {
        const detail = error.response.data?.message || error.response.statusText;
        return new Error(`Gophish respondió ${error.response.status}: ${detail}`);
    }
    if (error.code === "ECONNREFUSED" || error.code === "ETIMEDOUT") {
        return new Error("No se pudo conectar con el servidor Gophish. Verifica GOPHISH_API_URL y la red.");
    }
    return error;
};

// Crea o reemplaza el grupo de objetivos en Gophish a partir de los
// empleados (evita exportar/importar CSV a mano).
export const upsertGroup = async (groupName, employees) => {
    try {
        const client = buildClient();

        const targets = employees.map((employee) => {
            const [firstName, ...rest] = (employee.fullName || "").trim().split(" ");
            return {
                first_name: firstName || employee.fullName,
                last_name: rest.join(" "),
                email: employee.email,
                position: employee.position || ""
            };
        });

        const { data: existingGroups } = await client.get("/groups/");
        const existingGroup = (existingGroups || []).find((g) => g.name === groupName);

        if (existingGroup) {
            const { data } = await client.put(`/groups/${existingGroup.id}`, {
                id: existingGroup.id, name: groupName, targets
            });
            return data;
        }

        const { data } = await client.post("/groups/", { name: groupName, targets });
        return data;
    } catch (error) {
        throw unwrapError(error);
    }
};

// Crea y lanza la campaña en Gophish referenciando por nombre la
// plantilla / landing / sending profile ya elegidos.
export const launchCampaign = async ({ name, templateName, pageName, sendingProfileName, groupName, url, launchDate }) => {
    try {
        const client = buildClient();

        const payload = {
            name,
            template: { name: templateName },
            page: { name: pageName },
            smtp: { name: sendingProfileName },
            groups: [{ name: groupName }],
            url: url || ""
        };

        if (launchDate) payload.launch_date = new Date(launchDate).toISOString();

        const { data } = await client.post("/campaigns/", payload);
        return data;
    } catch (error) {
        throw unwrapError(error);
    }
};

// Detalle de la campaña en Gophish (incluye "results" por objetivo y
// "timeline"), que se usa para sincronizar el embudo.
export const getCampaignResults = async (gophishCampaignId) => {
    try {
        const client = buildClient();
        const { data } = await client.get(`/campaigns/${gophishCampaignId}`);
        return data;
    } catch (error) {
        throw unwrapError(error);
    }
};

export const deleteCampaign = async (gophishCampaignId) => {
    try {
        const client = buildClient();
        await client.delete(`/campaigns/${gophishCampaignId}`);
    } catch (error) {
        if (error.response?.status === 404) return;
        throw unwrapError(error);
    }
};
