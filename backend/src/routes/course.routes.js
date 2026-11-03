import express from "express";

import {
    createCourse,
    getCourses,
    getCourse,
    updateCourse,
    deleteCourse,
    addModule,
    updateModule,
    uploadModulePdf,
    uploadModuleVideo,
    deleteModule
} from "../controllers/course.controller.js";

import { courseContentUpload } from "../middlewares/upload.middleware.js";

const router = express.Router();

router.post("/", createCourse);
router.get("/", getCourses);
router.get("/:courseId", getCourse);
router.put("/:courseId", updateCourse);
router.delete("/:courseId", deleteCourse);

router.post("/:courseId/modules", addModule);
router.put("/:courseId/modules/:moduleId", updateModule);
router.delete("/:courseId/modules/:moduleId", deleteModule);

// Material del curso en S3
router.post("/:courseId/modules/:moduleId/pdf", courseContentUpload.single("file"), uploadModulePdf);
router.post("/:courseId/modules/:moduleId/video", courseContentUpload.single("file"), uploadModuleVideo);

export default router;
