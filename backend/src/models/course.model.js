import mongoose from "mongoose";

// Un módulo puede traer PDF y/o video (subidos a S3), o un video por link
// externo (Vimeo/YouTube no listado), y/o un quiz. No son excluyentes.
const CourseModuleSchema = new mongoose.Schema({

    title: { type: String, required: true },
    order: { type: Number, default: 0 },
    description: String,

    pdf: {
        s3Key: String,
        s3Bucket: String,
        originalName: String
    },

    video: {
        s3Key: String,
        s3Bucket: String,
        originalName: String,
        externalUrl: String // alternativa si el video no se aloja en S3
    },

    quiz: [{
        question: String,
        options: [String],
        correctIndex: Number
    }],

    // Puntaje mínimo (0-100) para aprobar el quiz del módulo.
    passingScore: { type: Number, default: 80 }

});

// El curso vive en la línea de concientización. Puede ser global (para
// todos los clientes) o específico de un cliente vía crmCompanyId.
const CourseSchema = new mongoose.Schema({

    // null = curso base para toda la línea; con valor = curso de un cliente
    crmCompanyId: { type: String, default: null, index: true },

    title: { type: String, required: true },
    description: String,

    active: { type: Boolean, default: true },

    modules: [CourseModuleSchema]

}, { timestamps: true });

export default mongoose.model("Course", CourseSchema);
