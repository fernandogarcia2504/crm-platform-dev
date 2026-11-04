import mongoose from "mongoose";

// Acceso al PORTAL DE CLIENTE de un contacto de la empresa (línea de
// phishing / concientización). El contacto vive en el CRM; aquí solo se
// guarda la referencia (crmContactId) + un snapshot de nombre/correo y las
// credenciales del portal. El portal es de SOLO LECTURA: el contacto ve el
// avance general de las campañas de su empresa, sin nombres de empleados.
const ClientAccountSchema = new mongoose.Schema({

    // --- enlace al CRM (por referencia, sin acoplamiento de datos) ---
    crmCompanyId: { type: String, required: true, index: true },
    companyName: { type: String, required: true },
    crmContactId: { type: String, required: true },

    // snapshot del contacto (para no llamar al CRM al listar/loguear)
    fullName: { type: String, required: true },
    email: { type: String, required: true },
    position: String,

    status: {
        type: String,
        enum: ["Activo", "Inactivo"],
        default: "Activo"
    },

    // Credenciales del portal de cliente. Nunca se guarda la contraseña en
    // texto plano, solo su hash; el texto plano se devuelve una sola vez al
    // generarla o regenerarla.
    username: { type: String, required: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    credentialsIssuedAt: Date,

    // true mientras siga siendo la temporal generada por el staff
    mustChangePassword: { type: Boolean, default: true },

    lastLoginAt: Date

}, { timestamps: true });

// Un contacto del CRM tiene a lo sumo un acceso al portal
ClientAccountSchema.index({ crmContactId: 1 }, { unique: true });
// El usuario (correo) es único a nivel global del portal
ClientAccountSchema.index({ username: 1 }, { unique: true });

export default mongoose.model("ClientAccount", ClientAccountSchema);
