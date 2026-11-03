// La plataforma NO tiene su propia colección de usuarios: comparte los
// del CRM. El login reenvía las credenciales al CRM y devuelve su token.
// Como el CRM firma el JWT con el MISMO JWT_SECRET, ese token es válido
// aquí (ver verifyStaff). Así hay una sola fuente de usuarios.
const CRM_API_URL = process.env.CRM_API_URL || "http://localhost:3000";

export const login = async (req, res) => {

    try {

        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ message: "Usuario y contraseña son requeridos" });
        }

        const response = await fetch(`${CRM_API_URL}/api/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json().catch(() => ({}));

        // Se reenvía tal cual la respuesta del CRM (token + user, o el error)
        return res.status(response.status).json(data);

    } catch (error) {

        console.error("Error al autenticar contra el CRM:", error.message);

        return res.status(502).json({
            message: "No se pudo contactar al CRM para autenticar. Verifica que el CRM esté arriba y CRM_API_URL."
        });

    }

};
