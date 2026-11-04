// Puente de lectura hacia el CRM: la plataforma no es dueña de las
// empresas (viven en el CRM). Este endpoint reenvía la petición al CRM
// usando el MISMO token de staff del usuario, y devuelve la lista de
// clientes lista para operar.
const CRM_API_URL = process.env.CRM_API_URL || "http://localhost:3000";

export const getClients = async (req, res) => {

    try {

        const response = await fetch(`${CRM_API_URL}/api/companies`, {
            headers: { "Authorization": req.headers.authorization || "" }
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            return res.status(response.status).json(data);
        }

        const clients = (data.companies || []).map((c) => ({
            crmCompanyId: c._id,
            companyName: c.name,
            website: c.website,
            status: c.status,
            lines: c.lines || []
        }));

        return res.status(200).json({ clients });

    } catch (error) {
        console.error("Error al leer clientes del CRM:", error.message);
        return res.status(502).json({
            message: "No se pudo contactar al CRM. Verifica que esté arriba y CRM_API_URL."
        });
    }

};

// Contactos de una empresa del CRM. Se usa para elegir a qué contacto se le
// genera acceso al portal de cliente. Reenvía con el MISMO token de staff.
export const getCompanyContacts = async (req, res) => {

    try {

        const { companyId } = req.params;

        const response = await fetch(`${CRM_API_URL}/api/contacts/${companyId}`, {
            headers: { "Authorization": req.headers.authorization || "" }
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            return res.status(response.status).json(data);
        }

        const contacts = (data.contacts || []).map((c) => ({
            crmContactId: c._id,
            fullName: c.fullName,
            email: c.email,
            position: c.position,
            phone: c.phone,
            isPrimary: c.isPrimary
        }));

        return res.status(200).json({ contacts });

    } catch (error) {
        console.error("Error al leer contactos del CRM:", error.message);
        return res.status(502).json({
            message: "No se pudo contactar al CRM. Verifica que esté arriba y CRM_API_URL."
        });
    }

};
