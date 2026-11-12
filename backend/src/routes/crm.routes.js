import express from "express";
import { getClients, getCompanyContacts, getCompanyProjects } from "../controllers/crm.controller.js";

const router = express.Router();

// Lista de clientes (empresas) leída del CRM
router.get("/companies", getClients);

// Contactos de una empresa (para asignar acceso al portal de cliente)
router.get("/companies/:companyId/contacts", getCompanyContacts);

// Proyectos de una empresa (para ligar operaciones a su proyecto comercial)
router.get("/companies/:companyId/projects", getCompanyProjects);

export default router;
