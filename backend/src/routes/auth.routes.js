import express from "express";
import { login } from "../controllers/auth.controller.js";

const router = express.Router();

// Login de staff: se delega al CRM (usuarios compartidos). No hay
// registro aquí; los usuarios se administran en el CRM.
router.post("/login", login);

export default router;
