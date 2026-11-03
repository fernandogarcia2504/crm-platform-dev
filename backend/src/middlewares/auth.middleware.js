import jwt from "jsonwebtoken";

// Staff de Atalaya (mismos usuarios que el CRM: el token se emite allá
// con el mismo JWT_SECRET, así que aquí solo se valida).
export const verifyStaff = (req, res, next) => {

    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Token no proporcionado" });
    }

    const token = authHeader.split(" ")[1];

    try {

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Un token de trainee NO es válido para la consola de operación
        if (decoded.type === "trainee") {
            return res.status(403).json({ message: "Token no válido para la consola" });
        }

        req.user = { id: decoded.id, role: decoded.role };

        next();

    } catch (error) {
        return res.status(401).json({ message: "Token inválido o expirado" });
    }

};

// Trainee del portal de cursos (colaboradores de los clientes). Token
// separado, emitido en courseAuth con type="trainee".
export const verifyTrainee = (req, res, next) => {

    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Token no proporcionado" });
    }

    const token = authHeader.split(" ")[1];

    try {

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (decoded.type !== "trainee") {
            return res.status(403).json({ message: "Token no válido para el portal de cursos" });
        }

        req.trainee = { id: decoded.id };

        next();

    } catch (error) {
        return res.status(401).json({ message: "Token inválido o expirado" });
    }

};
