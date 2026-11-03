import { PenTool } from "lucide-react";

// Marca claramente que la línea 1 (Exposición/EASM) es SOLO diseño en
// esta fase: la UI corre con datos de ejemplo, sin funcionalidad real.
export default function DesignBanner() {
    return (
        <div className="mt-4 flex items-center gap-2.5 rounded-md border border-warn/30 bg-warn/10 px-3.5 py-2.5 text-[0.82rem] text-warn">
            <PenTool size={15} className="flex-none" />
            <span>
                <b>Solo diseño.</b> Esta línea muestra la experiencia con datos de ejemplo; aún no ejecuta herramientas.
            </span>
        </div>
    );
}
