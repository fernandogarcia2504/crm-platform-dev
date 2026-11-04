import crypto from "crypto";
import bcrypt from "bcrypt";

import ClientAccount from "../models/clientAccount.model.js";

// Gestión de accesos al PORTAL DE CLIENTE (solo staff). El staff elige a
// qué contacto del CRM se le genera acceso; la contraseña temporal se
// devuelve una sola vez.

const generateTempPassword = () => {
    const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
    let password = "";
    for (let i = 0; i < 12; i++) {
        password += alphabet[crypto.randomInt(0, alphabet.length)];
    }
    return password;
};

const serialize = (account, plainPassword) => ({
    _id: account._id,
    crmCompanyId: account.crmCompanyId,
    companyName: account.companyName,
    crmContactId: account.crmContactId,
    fullName: account.fullName,
    email: account.email,
    position: account.position,
    status: account.status,
    username: account.username,
    mustChangePassword: account.mustChangePassword,
    credentialsIssuedAt: account.credentialsIssuedAt,
    lastLoginAt: account.lastLoginAt,
    ...(plainPassword ? { temporaryPassword: plainPassword } : {})
});

// GET /api/client-accounts/company/:crmCompanyId
export const listClientAccounts = async (req, res) => {
    try {
        const { crmCompanyId } = req.params;
        const accounts = await ClientAccount.find({ crmCompanyId }).sort({ createdAt: -1 });
        return res.status(200).json({ accounts: accounts.map((a) => serialize(a)) });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Error al obtener los accesos" });
    }
};

// POST /api/client-accounts  — genera acceso para un contacto elegido
export const createClientAccount = async (req, res) => {
    try {
        const { crmCompanyId, companyName, crmContactId, fullName, email, position } = req.body;

        if (!crmCompanyId || !companyName || !crmContactId || !fullName || !email) {
            return res.status(400).json({ message: "Faltan datos del contacto (empresa, contacto, nombre y correo)" });
        }

        const existing = await ClientAccount.findOne({ crmContactId });
        if (existing) {
            return res.status(409).json({ message: "Este contacto ya tiene acceso al portal" });
        }

        const normalizedUsername = email.trim().toLowerCase();

        const usernameTaken = await ClientAccount.findOne({ username: normalizedUsername });
        if (usernameTaken) {
            return res.status(409).json({ message: "Ya existe un acceso con ese correo" });
        }

        const plainPassword = generateTempPassword();
        const passwordHash = await bcrypt.hash(plainPassword, 10);

        const account = await ClientAccount.create({
            crmCompanyId,
            companyName,
            crmContactId,
            fullName,
            email,
            position,
            username: normalizedUsername,
            passwordHash,
            credentialsIssuedAt: new Date(),
            mustChangePassword: true,
            status: "Activo"
        });

        return res.status(201).json({ account: serialize(account, plainPassword) });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Error al generar el acceso" });
    }
};

// POST /api/client-accounts/:id/regenerate  — nueva contraseña temporal
export const regenerateClientCredentials = async (req, res) => {
    try {
        const { id } = req.params;

        const account = await ClientAccount.findById(id);
        if (!account) {
            return res.status(404).json({ message: "El acceso no existe" });
        }

        const plainPassword = generateTempPassword();
        account.passwordHash = await bcrypt.hash(plainPassword, 10);
        account.credentialsIssuedAt = new Date();
        account.mustChangePassword = true;
        await account.save();

        return res.status(200).json({ account: serialize(account, plainPassword) });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Error al regenerar el acceso" });
    }
};

// PATCH /api/client-accounts/:id  — activar / desactivar
export const toggleClientAccount = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!["Activo", "Inactivo"].includes(status)) {
            return res.status(400).json({ message: "Estado inválido" });
        }

        const account = await ClientAccount.findByIdAndUpdate(id, { status }, { new: true });
        if (!account) {
            return res.status(404).json({ message: "El acceso no existe" });
        }

        return res.status(200).json({ account: serialize(account) });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Error al actualizar el acceso" });
    }
};

// DELETE /api/client-accounts/:id
export const deleteClientAccount = async (req, res) => {
    try {
        const { id } = req.params;
        const account = await ClientAccount.findByIdAndDelete(id);
        if (!account) {
            return res.status(404).json({ message: "El acceso no existe" });
        }
        return res.status(200).json({ message: "Acceso eliminado correctamente" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Error al eliminar el acceso" });
    }
};
