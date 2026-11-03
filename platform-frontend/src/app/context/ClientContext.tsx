import React, { createContext, useState } from "react";

// Cliente del CRM sobre el que se está operando. La plataforma no es
// dueña de las empresas (viven en el CRM); solo guarda la referencia
// (crmCompanyId) + un nombre para mostrar.
export interface SelectedClient {
    crmCompanyId: string;
    companyName: string;
}

interface ClientContextType {
    client: SelectedClient | null;
    setClient: (client: SelectedClient) => void;
    clearClient: () => void;
}

export const ClientContext = createContext<ClientContextType | null>(null);

export const ClientProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {

    const [client, setClientState] = useState<SelectedClient | null>(() => {
        const raw = localStorage.getItem("selectedClient");
        return raw ? (JSON.parse(raw) as SelectedClient) : null;
    });

    const setClient = (next: SelectedClient) => {
        localStorage.setItem("selectedClient", JSON.stringify(next));
        setClientState(next);
    };

    const clearClient = () => {
        localStorage.removeItem("selectedClient");
        setClientState(null);
    };

    return (
        <ClientContext.Provider value={{ client, setClient, clearClient }}>
            {children}
        </ClientContext.Provider>
    );
};
