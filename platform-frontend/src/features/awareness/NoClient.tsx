import { useNavigate } from "react-router-dom";
import { Building2 } from "lucide-react";

import Button from "../../components/ui/Button";

// Guard reutilizable: la operación de concientización es por cliente.
export default function NoClient() {
    const navigate = useNavigate();
    return (
        <div className="mt-10 flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed border-line-2 py-16 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-surface-2 text-faint">
                <Building2 size={24} strokeWidth={1.6} />
            </span>
            <div>
                <p className="text-[0.95rem] font-semibold">Elige un cliente</p>
                <p className="mt-1 text-[0.85rem] text-muted">Esta operación se trabaja sobre un cliente del CRM.</p>
            </div>
            <Button variant="secondary" size="sm" onClick={() => navigate("/clientes")}>Ir a clientes</Button>
        </div>
    );
}
