import multer from "multer";

const storage = multer.memoryStorage();

const COURSE_CONTENT_MIME_TYPES = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "image/png",
    "image/jpeg",
    "image/webp",
    "video/mp4",
    "video/webm",
    "video/quicktime"
];

const courseContentFileFilter = (req, file, cb) => {
    if (COURSE_CONTENT_MIME_TYPES.includes(file.mimetype)) {
        return cb(null, true);
    }
    cb(new Error("Tipo de archivo no permitido"));
};

// Para el material del curso (PDF/video). Hasta 1 GB por archivo.
export const courseContentUpload = multer({
    storage,
    fileFilter: courseContentFileFilter,
    limits: { fileSize: 1024 * 1024 * 1024 }
});

export default courseContentUpload;
