import { api } from "../../lib/api";

// --- Tipos ---
export interface CrmContact {
    crmContactId: string;
    fullName: string;
    email: string;
    position?: string;
    phone?: string;
    isPrimary?: boolean;
}

export interface ClientAccount {
    _id: string;
    crmCompanyId: string;
    companyName: string;
    crmContactId: string;
    fullName: string;
    email: string;
    position?: string;
    status: "Activo" | "Inactivo";
    username: string;
    mustChangePassword: boolean;
    credentialsIssuedAt?: string;
    lastLoginAt?: string;
    temporaryPassword?: string;
}

// --- Contactos del CRM (para elegir a quién darle acceso) ---
export const listCompanyContacts = (crmCompanyId: string) =>
    api.get<{ contacts: CrmContact[] }>(`/crm/companies/${crmCompanyId}/contacts`).then((r) => r.contacts);

// --- Accesos al portal de cliente ---
export const listClientAccounts = (crmCompanyId: string) =>
    api.get<{ accounts: ClientAccount[] }>(`/client-accounts/company/${crmCompanyId}`).then((r) => r.accounts);

export const createClientAccount = (body: Record<string, unknown>) =>
    api.post<{ account: ClientAccount }>(`/client-accounts`, body).then((r) => r.account);

export const regenerateClientCredentials = (id: string) =>
    api.post<{ account: ClientAccount }>(`/client-accounts/${id}/regenerate`).then((r) => r.account);

export const toggleClientAccount = (id: string, status: "Activo" | "Inactivo") =>
    api.patch<{ account: ClientAccount }>(`/client-accounts/${id}`, { status }).then((r) => r.account);

export const deleteClientAccount = (id: string) =>
    api.del<{ message: string }>(`/client-accounts/${id}`);
