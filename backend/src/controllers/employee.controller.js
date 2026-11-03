import bcrypt from "bcrypt";
import crypto from "crypto";

import Employee from "../models/employee.model.js";
import Course from "../models/course.model.js";

// Contraseña temporal legible (12 caracteres, sin ambiguos 0/O o l/1)
const generateTempPassword = () => {
    const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
    let password = "";
    for (let i = 0; i < 12; i++) {
        password += alphabet[crypto.randomInt(0, alphabet.length)];
    }
    return password;
};

// Curso activo para un cliente: primero el específico del cliente, si no,
// el curso base de la línea (crmCompanyId = null). Si hay varios, el más
// reciente.
const findActiveCourse = async (crmCompanyId) => {
    return Course
        .findOne({
            active: true,
            $or: [{ crmCompanyId }, { crmCompanyId: null }]
        })
        .sort({ crmCompanyId: -1, createdAt: -1 });
};

const issueCourseCredentials = async (email, activeCourse) => {

    const plainPassword = generateTempPassword();
    const passwordHash = await bcrypt.hash(plainPassword, 10);
    const normalizedUsername = email.trim().toLowerCase();

    return {
        courseAccount: {
            username: normalizedUsername,
            passwordHash,
            credentialsIssuedAt: new Date(),
            mustChangePassword: true,
            course: activeCourse?._id ?? null,
            enrolled: Boolean(activeCourse),
            enrolledAt: activeCourse ? new Date() : null,
            completed: false,
            progress: 0,
            moduleProgress: []
        },
        plainPassword
    };
};

const serializeEmployee = (employee, plainPassword) => ({
    ...employee.toObject(),
    courseAccount: {
        ...employee.courseAccount.toObject(),
        passwordHash: undefined
    },
    ...(plainPassword ? { temporaryPassword: plainPassword } : {})
});


// CREAR UN EMPLEADO (y sus credenciales del curso)
export const createEmployee = async (req, res) => {

    try {

        const { crmCompanyId, companyName, fullName, position, email, sector, notes } = req.body;

        if (!crmCompanyId || !companyName) {
            return res.status(400).json({ message: "Se requiere la empresa (crmCompanyId y companyName)" });
        }

        if (!fullName || !email) {
            return res.status(400).json({ message: "El nombre completo y el correo son requeridos" });
        }

        const existingEmployee = await Employee.findOne({ crmCompanyId, email });

        if (existingEmployee) {
            return res.status(409).json({ message: "Ya existe un empleado con este correo en la empresa" });
        }

        const { courseAccount, plainPassword } = await issueCourseCredentials(
            email,
            await findActiveCourse(crmCompanyId)
        );

        const employee = await Employee.create({
            crmCompanyId, companyName, fullName, position, email, sector, notes, courseAccount
        });

        return res.status(201).json({
            message: "Empleado creado exitosamente",
            employee: serializeEmployee(employee, plainPassword)
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Error al crear el empleado" });
    }

};


// CARGA MASIVA (pegar la nómina completa de una vez)
export const bulkCreateEmployees = async (req, res) => {

    try {

        const { crmCompanyId, companyName, employees } = req.body;

        if (!crmCompanyId || !companyName) {
            return res.status(400).json({ message: "Se requiere la empresa (crmCompanyId y companyName)" });
        }

        if (!Array.isArray(employees) || employees.length === 0) {
            return res.status(400).json({ message: "Se requiere un arreglo de empleados" });
        }

        const existingEmails = new Set(
            (await Employee.find({ crmCompanyId }).select("email")).map((e) => e.email)
        );

        const activeCourse = await findActiveCourse(crmCompanyId);

        const created = [];
        const skipped = [];

        for (const row of employees) {

            const { fullName, position, email, sector, notes } = row;

            if (!fullName || !email) {
                skipped.push({ row, reason: "Falta nombre completo o correo" });
                continue;
            }

            if (existingEmails.has(email)) {
                skipped.push({ row, reason: "Correo duplicado en la empresa" });
                continue;
            }

            const { courseAccount, plainPassword } = await issueCourseCredentials(email, activeCourse);

            const employee = await Employee.create({
                crmCompanyId, companyName, fullName, position, email, sector, notes, courseAccount
            });

            existingEmails.add(email);
            created.push(serializeEmployee(employee, plainPassword));
        }

        return res.status(201).json({
            message: `${created.length} empleado(s) creado(s), ${skipped.length} omitido(s)`,
            created,
            skipped
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Error al cargar los empleados" });
    }

};


// LISTAR EMPLEADOS DE UNA EMPRESA
export const getEmployees = async (req, res) => {

    try {

        const { crmCompanyId } = req.params;

        const employees = await Employee
            .find({ crmCompanyId })
            .sort({ sector: 1, fullName: 1 });

        return res.status(200).json({
            employees: employees.map((e) => serializeEmployee(e))
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Error al obtener los empleados" });
    }

};


// OBTENER UN EMPLEADO
export const getEmployee = async (req, res) => {

    try {

        const { crmCompanyId, employeeId } = req.params;

        const employee = await Employee.findOne({ _id: employeeId, crmCompanyId });

        if (!employee) {
            return res.status(404).json({ message: "El empleado no existe" });
        }

        return res.status(200).json({ employee: serializeEmployee(employee) });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Error al obtener el empleado" });
    }

};


// ACTUALIZAR UN EMPLEADO
export const updateEmployee = async (req, res) => {

    try {

        const { crmCompanyId, employeeId } = req.params;
        const { fullName, position, sector, status, notes, courseAccount } = req.body;

        const employee = await Employee.findOne({ _id: employeeId, crmCompanyId });

        if (!employee) {
            return res.status(404).json({ message: "El empleado no existe" });
        }

        if (fullName !== undefined) employee.fullName = fullName;
        if (position !== undefined) employee.position = position;
        if (sector !== undefined) employee.sector = sector;
        if (status !== undefined) employee.status = status;
        if (notes !== undefined) employee.notes = notes;

        if (courseAccount !== undefined) {

            if (courseAccount.enrolled !== undefined) {
                employee.courseAccount.enrolled = courseAccount.enrolled;
                if (courseAccount.enrolled && !employee.courseAccount.enrolledAt) {
                    employee.courseAccount.enrolledAt = new Date();
                }
            }

            if (courseAccount.completed !== undefined) {
                employee.courseAccount.completed = courseAccount.completed;
                employee.courseAccount.completedAt = courseAccount.completed ? new Date() : null;
            }

            if (courseAccount.progress !== undefined) {
                employee.courseAccount.progress = courseAccount.progress;
            }

            if (courseAccount.course !== undefined) {
                employee.courseAccount.course = courseAccount.course;
            }

        }

        await employee.save();

        return res.status(200).json({
            message: "Empleado actualizado correctamente",
            employee: serializeEmployee(employee)
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Error al actualizar el empleado" });
    }

};


// REGENERAR CREDENCIALES DEL CURSO
export const regenerateCourseCredentials = async (req, res) => {

    try {

        const { crmCompanyId, employeeId } = req.params;

        const employee = await Employee.findOne({ _id: employeeId, crmCompanyId });

        if (!employee) {
            return res.status(404).json({ message: "El empleado no existe" });
        }

        const { courseAccount, plainPassword } = await issueCourseCredentials(employee.email);

        employee.courseAccount.username = courseAccount.username;
        employee.courseAccount.passwordHash = courseAccount.passwordHash;
        employee.courseAccount.credentialsIssuedAt = courseAccount.credentialsIssuedAt;
        employee.courseAccount.mustChangePassword = true;

        await employee.save();

        return res.status(200).json({
            message: "Credenciales regeneradas exitosamente",
            employee: serializeEmployee(employee, plainPassword)
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Error al regenerar las credenciales" });
    }

};


// ASIGNAR/RE-SINCRONIZAR EL CURSO A TODOS LOS EMPLEADOS DE UNA EMPRESA
export const assignCourseToCompany = async (req, res) => {

    try {

        const { crmCompanyId } = req.params;
        const { courseId } = req.body;

        const course = courseId
            ? await Course.findById(courseId)
            : await findActiveCourse(crmCompanyId);

        if (!course) {
            return res.status(404).json({
                message: courseId ? "El curso no existe" : "Todavía no hay un curso activo para esta empresa"
            });
        }

        const result = await Employee.updateMany(
            { crmCompanyId },
            {
                $set: {
                    "courseAccount.course": course._id,
                    "courseAccount.enrolled": true,
                    "courseAccount.enrolledAt": new Date(),
                    "courseAccount.progress": 0,
                    "courseAccount.completed": false,
                    "courseAccount.completedAt": null,
                    "courseAccount.moduleProgress": []
                }
            }
        );

        return res.status(200).json({
            message: `Curso asignado a ${result.modifiedCount} empleado(s)`
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Error al asignar el curso" });
    }

};


// ELIMINAR UN EMPLEADO
export const deleteEmployee = async (req, res) => {

    try {

        const { crmCompanyId, employeeId } = req.params;

        const employee = await Employee.findOne({ _id: employeeId, crmCompanyId });

        if (!employee) {
            return res.status(404).json({ message: "El empleado no existe" });
        }

        await Employee.findByIdAndDelete(employeeId);

        return res.status(200).json({ message: "Empleado eliminado correctamente" });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Error al eliminar el empleado" });
    }

};
