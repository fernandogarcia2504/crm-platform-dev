import { motion } from "framer-motion";
import { Clock } from "lucide-react";

import PageHeader from "../../components/ui/PageHeader";

export default function ComingSoonPage({ line }: { line: string }) {
    return (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
            <PageHeader title={line} subtitle="Línea de negocio" />
            <div className="mt-10 flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed border-line-2 py-20 text-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-surface-2 text-faint">
                    <Clock size={24} strokeWidth={1.6} />
                </span>
                <div>
                    <p className="text-[1rem] font-semibold">Próximamente</p>
                    <p className="mt-1 max-w-[420px] text-[0.85rem] text-muted">
                        Esta línea tendrá su propia operación aislada dentro de la plataforma. Por ahora se gestiona
                        comercialmente desde el CRM.
                    </p>
                </div>
            </div>
        </motion.div>
    );
}
