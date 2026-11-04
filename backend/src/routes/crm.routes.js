import express from "express";
import { getClients, getCompanyContacts } from "../controllers/crm.controller.js";

const router = express.Router();

// Lista de clientes (empresas) leída del CRM
router.get("/companies", getClients);

// Contactos de una empresa (para asignar acceso al portal de cliente)
router.get("/companies/:companyId/contacts", getCompanyContacts);

export default router;
