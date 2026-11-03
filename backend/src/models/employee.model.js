import mongoose from "mongoose";

// Un colaborador del CLIENTE, objetivo de las campañas de concientización
// y alumno del curso. Vive en la plataforma (línea de phishing), NO en el
// CRM. Se enlaza al cliente del CRM por crmCompanyId; companyName es un
// snapshot para no tener que llamar al CRM al listar.
const EmployeeSchema = new mongoose.Schema({

    // --- enlace al CRM (sin acoplamiento de datos; solo referencia) ---
    crmCompanyId: { type: String, required: true, index: true },
    companyName: { type: String, required: true },

    fullName: { type: String, required: true },
    position: String,
    email: { type: String, required: true },
    sector: String,

    status: {
        type: String,
        enum: ["Activo", "Inactivo"],
        default: "Activo"
    },

    // Credenciales del curso de concientización. La contraseña nunca se
    // guarda en texto plano, solo su hash; el texto plano se devuelve una
    // única vez en la respuesta del endpoint que la genera.
    courseAccount: {

        username: String,
        passwordHash: String,
        credentialsIssuedAt: Date,

        // true mientras siga siendo la temporal generada al enrolar.
        mustChangePassword: { type: Boolean, default: true },

        course: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Course",
            default: null
        },

        enrolled: { type: Boolean, default: false },
        enrolledAt: Date,

        completed: { type: Boolean, default: false },
        completedAt: Date,

        progress: { type: Number, default: 0 },

        moduleProgress: [{
            module: { type: mongoose.Schema.Types.ObjectId, required: true },
            completed: { type: Boolean, default: false },
            completedAt: Date,
            quizScore: Number
        }]

    },

    notes: String

}, { timestamps: true });

// Un correo no se repite dentro de la misma empresa (cliente del CRM)
EmployeeSchema.index({ crmCompanyId: 1, email: 1 }, { unique: true });

export default mongoose.model("Employee", EmployeeSchema);
