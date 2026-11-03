import express from "express";

import {
    createEmployee,
    bulkCreateEmployees,
    getEmployees,
    getEmployee,
    updateEmployee,
    regenerateCourseCredentials,
    assignCourseToCompany,
    deleteEmployee
} from "../controllers/employee.controller.js";

const router = express.Router();

router.post("/", createEmployee);
router.post("/bulk", bulkCreateEmployees);

router.get("/company/:crmCompanyId", getEmployees);
router.post("/company/:crmCompanyId/assign-course", assignCourseToCompany);

router.get("/company/:crmCompanyId/:employeeId", getEmployee);
router.put("/company/:crmCompanyId/:employeeId", updateEmployee);
router.post("/company/:crmCompanyId/:employeeId/regenerate", regenerateCourseCredentials);
router.delete("/company/:crmCompanyId/:employeeId", deleteEmployee);

export default router;
