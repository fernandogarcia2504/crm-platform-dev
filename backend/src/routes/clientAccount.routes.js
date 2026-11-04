import express from "express";

import {
    listClientAccounts,
    createClientAccount,
    regenerateClientCredentials,
    toggleClientAccount,
    deleteClientAccount
} from "../controllers/clientAccount.controller.js";

const router = express.Router();

// Gestión de accesos al portal de cliente (solo staff; se monta con verifyStaff)
router.get("/company/:crmCompanyId", listClientAccounts);
router.post("/", createClientAccount);
router.post("/:id/regenerate", regenerateClientCredentials);
router.patch("/:id", toggleClientAccount);
router.delete("/:id", deleteClientAccount);

export default router;
