import { PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

import s3Client, { S3_BUCKET } from "../config/s3.js";
import Course from "../models/course.model.js";

const sanitizeFileName = (fileName) =>
    fileName
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .replace(/[^a-zA-Z0-9.\-_]/g, "_");

const getModulePrefix = (courseId, moduleId) =>
    `courses/${courseId}/modules/${moduleId}/`;

const uploadModuleFile = async (courseId, moduleId, file) => {
    const safeName = sanitizeFileName(file.originalname);
    const s3Key = `${getModulePrefix(courseId, moduleId)}${Date.now()}-${safeName}`;

    await s3Client.send(new PutObjectCommand({
        Bucket: S3_BUCKET,
        Key: s3Key,
        Body: file.buffer,
        ContentType: file.mimetype
    }));

    return { s3Key, s3Bucket: S3_BUCKET, originalName: file.originalname };
};


export const createCourse = async (req, res) => {
    try {
        const { title, description, active, crmCompanyId } = req.body;

        if (!title) {
            return res.status(400).json({ message: "El título es requerido" });
        }

        const course = await Course.create({
            crmCompanyId: crmCompanyId ?? null,
            title,
            description,
            active: active ?? true,
            modules: []
        });

        return res.status(201).json({ message: "Curso creado exitosamente", course });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Error al crear el curso" });
    }
};

// Lista cursos (filtro opcional ?crmCompanyId=). Para la consola de staff
// se incluyen las respuestas correctas (se usan en el editor).
export const getCourses = async (req, res) => {
    try {
        const { crmCompanyId } = req.query;
        const filter = crmCompanyId ? { crmCompanyId } : {};
        const courses = await Course.find(filter).sort({ createdAt: -1 });
        return res.status(200).json({ courses });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Error al obtener los cursos" });
    }
};

export const getCourse = async (req, res) => {
    try {
        const course = await Course.findById(req.params.courseId);
        if (!course) return res.status(404).json({ message: "El curso no existe" });
        return res.status(200).json({ course });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Error al obtener el curso" });
    }
};

export const updateCourse = async (req, res) => {
    try {
        const { title, description, active, crmCompanyId } = req.body;
        const course = await Course.findById(req.params.courseId);
        if (!course) return res.status(404).json({ message: "El curso no existe" });

        if (title !== undefined) course.title = title;
        if (description !== undefined) course.description = description;
        if (active !== undefined) course.active = active;
        if (crmCompanyId !== undefined) course.crmCompanyId = crmCompanyId;

        await course.save();
        return res.status(200).json({ message: "Curso actualizado correctamente", course });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Error al actualizar el curso" });
    }
};

export const deleteCourse = async (req, res) => {
    try {
        const course = await Course.findByIdAndDelete(req.params.courseId);
        if (!course) return res.status(404).json({ message: "El curso no existe" });
        return res.status(200).json({ message: "Curso eliminado correctamente" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Error al eliminar el curso" });
    }
};

// Agrega un módulo (título/descripción/orden/quiz). El PDF/video se suben
// después con los endpoints dedicados, una vez existe el moduleId.
export const addModule = async (req, res) => {
    try {
        const { title, description, order, quiz, passingScore } = req.body;

        if (!title) return res.status(400).json({ message: "El título del módulo es requerido" });

        const course = await Course.findById(req.params.courseId);
        if (!course) return res.status(404).json({ message: "El curso no existe" });

        course.modules.push({
            title,
            description,
            order: order ?? course.modules.length,
            quiz: quiz || [],
            passingScore: passingScore ?? 80
        });

        await course.save();
        return res.status(201).json({ message: "Módulo agregado correctamente", course });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Error al agregar el módulo" });
    }
};

// Actualiza un módulo (título/descripción/orden/quiz/link de video externo)
export const updateModule = async (req, res) => {
    try {
        const { courseId, moduleId } = req.params;
        const { title, description, order, quiz, passingScore, videoExternalUrl } = req.body;

        const course = await Course.findById(courseId);
        const mod = course?.modules.id(moduleId);
        if (!mod) return res.status(404).json({ message: "El módulo no existe" });

        if (title !== undefined) mod.title = title;
        if (description !== undefined) mod.description = description;
        if (order !== undefined) mod.order = order;
        if (quiz !== undefined) mod.quiz = quiz;
        if (passingScore !== undefined) mod.passingScore = passingScore;

        if (videoExternalUrl !== undefined) {
            mod.video = mod.video || {};
            mod.video.externalUrl = videoExternalUrl;
        }

        await course.save();
        return res.status(200).json({ message: "Módulo actualizado correctamente", course });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Error al actualizar el módulo" });
    }
};

// Sube/reemplaza el PDF de un módulo (archivo a S3)
export const uploadModulePdf = async (req, res) => {
    try {
        const { courseId, moduleId } = req.params;
        if (!req.file) return res.status(400).json({ message: "No se proporcionó ningún archivo" });

        const course = await Course.findById(courseId);
        const mod = course?.modules.id(moduleId);
        if (!mod) return res.status(404).json({ message: "El módulo no existe" });

        if (mod.pdf?.s3Key) {
            await s3Client.send(new DeleteObjectCommand({ Bucket: mod.pdf.s3Bucket, Key: mod.pdf.s3Key }));
        }

        mod.pdf = await uploadModuleFile(courseId, moduleId, req.file);

        await course.save();
        return res.status(200).json({ message: "PDF subido correctamente", course });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Error al subir el PDF" });
    }
};

// Sube/reemplaza el video de un módulo (archivo a S3)
export const uploadModuleVideo = async (req, res) => {
    try {
        const { courseId, moduleId } = req.params;
        if (!req.file) return res.status(400).json({ message: "No se proporcionó ningún archivo" });

        const course = await Course.findById(courseId);
        const mod = course?.modules.id(moduleId);
        if (!mod) return res.status(404).json({ message: "El módulo no existe" });

        if (mod.video?.s3Key) {
            await s3Client.send(new DeleteObjectCommand({ Bucket: mod.video.s3Bucket, Key: mod.video.s3Key }));
        }

        const uploaded = await uploadModuleFile(courseId, moduleId, req.file);
        mod.video = { ...uploaded, externalUrl: undefined };

        await course.save();
        return res.status(200).json({ message: "Video subido correctamente", course });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Error al subir el video" });
    }
};

export const deleteModule = async (req, res) => {
    try {
        const { courseId, moduleId } = req.params;
        const course = await Course.findById(courseId);
        const mod = course?.modules.id(moduleId);
        if (!mod) return res.status(404).json({ message: "El módulo no existe" });

        if (mod.pdf?.s3Key) {
            await s3Client.send(new DeleteObjectCommand({ Bucket: mod.pdf.s3Bucket, Key: mod.pdf.s3Key }));
        }
        if (mod.video?.s3Key) {
            await s3Client.send(new DeleteObjectCommand({ Bucket: mod.video.s3Bucket, Key: mod.video.s3Key }));
        }

        mod.deleteOne();
        await course.save();
        return res.status(200).json({ message: "Módulo eliminado correctamente", course });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Error al eliminar el módulo" });
    }
};
