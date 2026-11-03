import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import Employee from "../models/employee.model.js";

// LOGIN DEL PORTAL DE CURSOS (credenciales generadas al enrolar al
// empleado en employee.controller.js). Token separado: type="trainee".
export const courseLogin = async (req, res) => {

    try {

        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ message: "Usuario y contraseña son requeridos" });
        }

        const normalizedUsername = username.trim().toLowerCase();

        const employee = await Employee.findOne({
            "courseAccount.username": normalizedUsername
        });

        if (!employee || !employee.courseAccount?.passwordHash) {
            return res.status(401).json({ message: "Credenciales inválidas" });
        }

        if (employee.status === "Inactivo") {
            return res.status(403).json({ message: "Esta cuenta se encuentra inactiva" });
        }

        const passwordCorrect = await bcrypt.compare(
            password,
            employee.courseAccount.passwordHash
        );

        if (!passwordCorrect) {
            return res.status(401).json({ message: "Credenciales inválidas" });
        }

        const token = jwt.sign(
            { id: employee._id, type: "trainee" },
            process.env.JWT_SECRET,
            { expiresIn: "8h" }
        );

        return res.status(200).json({
            message: "Login exitoso",
            token,
            employee: {
                id: employee._id,
                fullName: employee.fullName,
                email: employee.email,
                company: employee.companyName,
                hasCourse: Boolean(employee.courseAccount.course),
                mustChangePassword: employee.courseAccount.mustChangePassword !== false
            }
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Error al iniciar sesión" });
    }

};
