// Script de prueba: crea (o actualiza) un trainee del portal de cursos con
// una contraseña conocida, para poder probar el login sin pasar por el alta
// completa de empleados. Lee la conexion de tu .env (MONGO_URI).
//
// Ejecutar desde atalaya-platform/backend:  node seedTrainee.js
//
// NOTA: esto es solo para pruebas locales. En produccion las credenciales
// se generan al enrolar al empleado (employee.controller.js) y son aleatorias.

import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcrypt";

import Employee from "./src/models/employee.model.js";
import Course from "./src/models/course.model.js";

// ---- credenciales de prueba (cambialas si quieres) ----
const TEST_USERNAME = "nando.garcia2504@gmail.com";
const TEST_PASSWORD = "Atalaya.2026";
// -------------------------------------------------------

const run = async () => {

    await mongoose.connect(process.env.MONGO_URI);
    console.log("Conectado a MongoDB");

    const passwordHash = await bcrypt.hash(TEST_PASSWORD, 10);

    // Si ya tienes un curso activo, enrola a este trainee en el.
    const activeCourse = await Course.findOne({ active: true }).sort({ createdAt: -1 });

    const courseAccount = {
        username: TEST_USERNAME.trim().toLowerCase(),
        passwordHash,
        credentialsIssuedAt: new Date(),
        mustChangePassword: false, // false = entra directo, sin forzar cambio
        course: activeCourse?._id ?? null,
        enrolled: Boolean(activeCourse),
        enrolledAt: activeCourse ? new Date() : null,
        completed: false,
        progress: 0,
        moduleProgress: []
    };

    const employee = await Employee.findOneAndUpdate(
        { "courseAccount.username": TEST_USERNAME.trim().toLowerCase() },
        {
            $set: {
                crmCompanyId: "seed-test",
                companyName: "Empresa de prueba",
                fullName: "Fernando (prueba)",
                email: TEST_USERNAME,
                status: "Activo",
                courseAccount
            }
        },
        { new: true, upsert: true }
    );

    console.log("\nTrainee listo:");
    console.log("  usuario:    ", employee.courseAccount.username);
    console.log("  contrasena: ", TEST_PASSWORD);
    console.log("  curso:      ", activeCourse ? activeCourse.title : "(ninguno activo todavia)");

    await mongoose.disconnect();
    console.log("\nListo. Ya puedes iniciar sesion en el portal.");
};

run().catch((err) => {
    console.error(err);
    process.exit(1);
});
