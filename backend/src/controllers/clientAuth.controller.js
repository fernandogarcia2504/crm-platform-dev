import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import ClientAccount from "../models/clientAccount.model.js";

// LOGIN DEL PORTAL DE CLIENTE (credenciales generadas por el staff en
// clientAccount.controller.js). Token separado: type="client". Lleva el
// crmCompanyId para acotar en el backend todo lo que el contacto puede ver.
export const clientLogin = async (req, res) => {

    try {

        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ message: "Usuario y contraseña son requeridos" });
        }

        const normalizedUsername = username.trim().toLowerCase();

        const account = await ClientAccount.findOne({ username: normalizedUsername });

        if (!account || !account.passwordHash) {
            return res.status(401).json({ message: "Credenciales inválidas" });
        }

        if (account.status === "Inactivo") {
            return res.status(403).json({ message: "Este acceso se encuentra inactivo" });
        }

        const passwordCorrect = await bcrypt.compare(password, account.passwordHash);

        if (!passwordCorrect) {
            return res.status(401).json({ message: "Credenciales inválidas" });
        }

        account.lastLoginAt = new Date();
        await account.save();

        const token = jwt.sign(
            { id: account._id, type: "client", crmCompanyId: account.crmCompanyId },
            process.env.JWT_SECRET,
            { expiresIn: "8h" }
        );

        return res.status(200).json({
            message: "Login exitoso",
            token,
            account: {
                id: account._id,
                fullName: account.fullName,
                email: account.email,
                company: account.companyName,
                mustChangePassword: account.mustChangePassword !== false
            }
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Error al iniciar sesión" });
    }

};
