import express from "express";
import { getClients } from "../controllers/crm.controller.js";

const router = express.Router();

// Lista de clientes (empresas) leída del CRM
router.get("/companies", getClients);

export default router;
