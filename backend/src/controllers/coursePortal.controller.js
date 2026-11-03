import bcrypt from "bcrypt";

import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import s3Client from "../config/s3.js";
import Employee from "../models/employee.model.js";
import Course from "../models/course.model.js";

const SIGNED_URL_EXPIRES_IN = 900; // 15 minutos

// Genera una URL firmada temporal para un archivo del módulo en S3.
const withSignedFileUrl = async (file) => {
    if (!file || !file.s3Key) return null;
    return getSignedUrl(
        s3Client,
        new GetObjectCommand({ Bucket: file.s3Bucket, Key: file.s3Key }),
        { expiresIn: SIGNED_URL_EXPIRES_IN }
    );
};

// Recalcula el resumen (progress %, completed) a partir de moduleProgress.
const recomputeSummary = (employee, totalModules) => {

    const doneCount = employee.courseAccount.moduleProgress.filter((e) => e.completed).length;

    employee.courseAccount.progress = totalModules > 0
        ? Math.round((doneCount / totalModules) * 100)
        : 0;

    if (totalModules > 0 && doneCount === totalModules && !employee.courseAccount.completed) {
        employee.courseAccount.completed = true;
        employee.courseAccount.completedAt = new Date();
    }

};

const findOrCreateProgressEntry = (employee, moduleId) => {

    let entry = employee.courseAccount.moduleProgress.find(
        (item) => String(item.module) === String(moduleId)
    );

    if (!entry) {
        employee.courseAccount.moduleProgress.push({ module: moduleId });
        entry = employee.courseAccount.moduleProgress[
            employee.courseAccount.moduleProgress.length - 1
        ];
    }

    return entry;

};


// DATOS BÁSICOS DEL TRAINEE LOGUEADO
export const getMe = async (req, res) => {

    try {

        const employee = await Employee
            .findById(req.trainee.id)
            .select("-courseAccount.passwordHash");

        if (!employee) {
            return res.status(404).json({ message: "Empleado no encontrado" });
        }

        return res.status(200).json({
            employee: {
                id: employee._id,
                fullName: employee.fullName,
                email: employee.email,
                company: employee.companyName,
                progress: employee.courseAccount.progress,
                completed: employee.courseAccount.completed,
                mustChangePassword: employee.courseAccount.mustChangePassword !== false
            }
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Error al obtener el perfil" });
    }

};


// EL CURSO ASIGNADO AL TRAINEE, CON SU AVANCE MEZCLADO. El material se
// sirve por URL externa (pdfUrl/videoUrl); sin S3 (en pausa).
export const getMyCourse = async (req, res) => {

    try {

        const employee = await Employee.findById(req.trainee.id);

        if (!employee) {
            return res.status(404).json({ message: "Empleado no encontrado" });
        }

        if (!employee.courseAccount.course) {
            return res.status(404).json({ message: "Todavía no tienes un curso asignado" });
        }

        const course = await Course.findById(employee.courseAccount.course);

        if (!course || !course.active) {
            return res.status(404).json({ message: "El curso no está disponible" });
        }

        const progressByModule = new Map(
            employee.courseAccount.moduleProgress.map((entry) => [String(entry.module), entry])
        );

        const modules = await Promise.all(
            course.modules
                .sort((a, b) => a.order - b.order)
                .map(async (mod) => {

                    const progress = progressByModule.get(String(mod._id));

                    return {
                        id: mod._id,
                        title: mod.title,
                        description: mod.description,
                        order: mod.order,
                        pdfUrl: await withSignedFileUrl(mod.pdf),
                        videoUrl: mod.video?.externalUrl || await withSignedFileUrl(mod.video),
                        hasQuiz: mod.quiz && mod.quiz.length > 0,
                        // Las respuestas correctas nunca se mandan al front
                        quiz: (mod.quiz || []).map((q) => ({ question: q.question, options: q.options })),
                        completed: progress?.completed || false,
                        quizScore: progress?.quizScore ?? null
                    };

                })
        );

        return res.status(200).json({
            course: {
                id: course._id,
                title: course.title,
                description: course.description,
                progress: employee.courseAccount.progress,
                completed: employee.courseAccount.completed,
                modules
            }
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Error al obtener el curso" });
    }

};


// MARCAR UN MÓDULO SIN QUIZ (lectura/video) COMO COMPLETADO
export const completeModule = async (req, res) => {

    try {

        const { moduleId } = req.params;

        const employee = await Employee.findById(req.trainee.id);

        if (!employee || !employee.courseAccount.course) {
            return res.status(404).json({ message: "No tienes un curso asignado" });
        }

        const course = await Course.findById(employee.courseAccount.course);
        const mod = course?.modules.id(moduleId);

        if (!mod) {
            return res.status(404).json({ message: "El módulo no existe" });
        }

        const entry = findOrCreateProgressEntry(employee, moduleId);
        entry.completed = true;
        entry.completedAt = new Date();

        recomputeSummary(employee, course.modules.length);
        await employee.save();

        return res.status(200).json({
            message: "Módulo completado",
            progress: employee.courseAccount.progress,
            completed: employee.courseAccount.completed
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Error al completar el módulo" });
    }

};


// CALIFICAR Y REGISTRAR EL QUIZ DE UN MÓDULO
export const submitQuiz = async (req, res) => {

    try {

        const { moduleId } = req.params;
        const { answers } = req.body;

        if (!Array.isArray(answers)) {
            return res.status(400).json({ message: "Se requiere un arreglo de respuestas" });
        }

        const employee = await Employee.findById(req.trainee.id);

        if (!employee || !employee.courseAccount.course) {
            return res.status(404).json({ message: "No tienes un curso asignado" });
        }

        const course = await Course.findById(employee.courseAccount.course);
        const mod = course?.modules.id(moduleId);

        if (!mod || !mod.quiz?.length) {
            return res.status(404).json({ message: "Este módulo no tiene quiz" });
        }

        const correctCount = mod.quiz.reduce(
            (count, question, index) => (answers[index] === question.correctIndex ? count + 1 : count),
            0
        );

        const score = Math.round((correctCount / mod.quiz.length) * 100);
        const passed = score >= (mod.passingScore ?? 80);

        const entry = findOrCreateProgressEntry(employee, moduleId);
        entry.quizScore = score;

        if (passed) {
            entry.completed = true;
            entry.completedAt = new Date();
        }

        recomputeSummary(employee, course.modules.length);
        await employee.save();

        return res.status(200).json({
            message: passed ? "Quiz aprobado" : "Quiz no aprobado, puedes reintentar",
            score,
            passed,
            progress: employee.courseAccount.progress,
            completed: employee.courseAccount.completed
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Error al calificar el quiz" });
    }

};


// CAMBIAR LA CONTRASEÑA DEL PORTAL
export const changePassword = async (req, res) => {

    try {

        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: "Se requiere la contraseña actual y la nueva" });
        }

        if (newPassword.length < 8) {
            return res.status(400).json({ message: "La nueva contraseña debe tener al menos 8 caracteres" });
        }

        const employee = await Employee.findById(req.trainee.id);

        if (!employee || !employee.courseAccount?.passwordHash) {
            return res.status(404).json({ message: "Empleado no encontrado" });
        }

        const currentCorrect = await bcrypt.compare(currentPassword, employee.courseAccount.passwordHash);

        if (!currentCorrect) {
            return res.status(401).json({ message: "La contraseña actual no es correcta" });
        }

        employee.courseAccount.passwordHash = await bcrypt.hash(newPassword, 10);
        employee.courseAccount.mustChangePassword = false;

        await employee.save();

        return res.status(200).json({ message: "Contraseña actualizada correctamente" });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Error al cambiar la contraseña" });
    }

};
