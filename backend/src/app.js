import express from "express";
import cors from "cors";

import authRoutes from "./routes/auth.routes.js";
import employeeRoutes from "./routes/employee.routes.js";
import courseRoutes from "./routes/course.routes.js";
import courseAuthRoutes from "./routes/courseAuth.routes.js";
import coursePortalRoutes from "./routes/coursePortal.routes.js";
import campaignRoutes from "./routes/campaign.routes.js";
import reportRoutes from "./routes/report.routes.js";
import crmRoutes from "./routes/crm.routes.js";

import { verifyStaff, verifyTrainee } from "./middlewares/auth.middleware.js";

const app = express();

const allowedOrigins = [
    process.env.PLATFORM_ORIGIN || "http://localhost:5175",
    process.env.TRAINEE_PORTAL_ORIGIN || "http://localhost:5176"
];

// En desarrollo cualquier localhost sirve (Vite puede moverse de puerto).
// En producción se usan los orígenes explícitos de allowedOrigins.
const isLocalhost = (origin) =>
    /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || isLocalhost(origin) || allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        callback(new Error("Origen no permitido por CORS"));
    }
}));

app.use(express.json());

app.get("/api/health", (req, res) => res.json({ ok: true, service: "atalaya-platform" }));

app.use("/api/auth", authRoutes);

// Puente de lectura hacia el CRM (clientes). Fuente única = CRM.
app.use("/api/crm", verifyStaff, crmRoutes);

// =====================================================================
// LÍNEAS DE NEGOCIO — procesos SEPARADOS. Cada línea tiene su propio
// espacio; no comparten flujos ni datos operativos entre sí.
// =====================================================================

// --- Línea: Concientización / Phishing (operación real) ---
// Consola de staff (token de staff del CRM/plataforma)
app.use("/api/employees", verifyStaff, employeeRoutes);
app.use("/api/courses", verifyStaff, courseRoutes);
app.use("/api/campaigns", verifyStaff, campaignRoutes);
app.use("/api/reports", verifyStaff, reportRoutes);

// Portal de trainees (colaboradores del cliente): login público + rutas
// protegidas con su PROPIO token (type="trainee"), nunca el de staff.
app.use("/api/course-auth", courseAuthRoutes);
app.use("/api/course-portal", verifyTrainee, coursePortalRoutes);

// --- Línea 1: Exposición / EASM ---
// SOLO DISEÑO en esta fase: no hay backend. La UI corre con datos de
// ejemplo. Cuando se active, su operación (orquestador de herramientas,
// hallazgos, reporte de postura) vivirá aquí, aislada de las demás.

// --- Líneas: Investigación y Debida Diligencia / Evaluación de Riesgos ---
// Placeholders por ahora (sin backend).

export default app;
