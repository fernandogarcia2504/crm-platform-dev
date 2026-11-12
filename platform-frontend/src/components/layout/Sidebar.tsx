import { useContext } from "react";
import { NavLink, useNavigate } from "react-router-dom";

import {
    LayoutDashboard,
    Radar,
    Users,
    BookOpen,
    Send,
    FileBarChart2,
    Search,
    Gauge,
    LogOut,
    Building2,
    ChevronsUpDown,
    ShieldCheck,
    ShieldAlert,
    Library
} from "lucide-react";

import { AuthContext } from "../../app/context/AuthContext";
import { ClientContext } from "../../app/context/ClientContext";

type ItemProps = { to: string; label: string; icon: React.ReactNode; disabled?: boolean };

function Item({ to, label, icon, disabled }: ItemProps) {
    if (disabled) {
        return (
            <div className="flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[0.86rem] font-medium text-faint/60">
                <span className="flex-none">{icon}</span>
                <span className="truncate">{label}</span>
                <span className="ml-auto text-[0.62rem] uppercase tracking-wide text-faint/70">pronto</span>
            </div>
        );
    }
    return (
        <NavLink
            to={to}
            className={({ isActive }) =>
                [
                    "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[0.86rem] font-medium transition-colors",
                    isActive ? "bg-surface-2 text-ink" : "text-muted hover:bg-surface-2/60 hover:text-ink"
                ].join(" ")
            }
        >
            {({ isActive }) => (
                <>
                    <span className={["flex-none", isActive ? "text-accent" : "text-faint"].join(" ")}>{icon}</span>
                    <span className="truncate">{label}</span>
                </>
            )}
        </NavLink>
    );
}

function LineHeader({ title, chip, tone }: { title: string; chip: string; tone: string }) {
    return (
        <div className="flex items-center justify-between px-2.5 pt-5 pb-1.5">
            <p className="text-[0.66rem] font-semibold uppercase tracking-[0.08em] text-faint">{title}</p>
            <span className={`rounded px-1.5 py-0.5 text-[0.6rem] font-semibold ${tone}`}>{chip}</span>
        </div>
    );
}

export default function Sidebar() {
    const navigate = useNavigate();
    const auth = useContext(AuthContext);
    const clientCtx = useContext(ClientContext);
    const s = 17;

    const handleLogout = () => {
        auth?.logout();
        navigate("/");
    };

    return (
        <aside className="flex h-screen w-[256px] flex-none flex-col border-r border-line bg-surface">
            {/* marca */}
            <div className="flex items-center gap-2.5 px-3.5 pt-4 pb-3">
                <span className="flex h-8 w-8 flex-none items-center justify-center rounded-lg bg-accent">
                    <svg width="17" height="17" viewBox="0 0 26 26" fill="none">
                        <path d="M9 23 L10.5 9 H15.5 L17 23 Z" stroke="#fff" strokeWidth="1.8" strokeLinejoin="round" />
                        <path d="M8.5 15 H17.5" stroke="#fff" strokeWidth="1.5" />
                        <circle cx="13" cy="6.2" r="2.5" fill="#fff" />
                    </svg>
                </span>
                <div className="min-w-0">
                    <p className="truncate text-[0.95rem] font-semibold leading-tight">Atalaya</p>
                    <p className="truncate text-[0.72rem] text-muted leading-tight">Operación</p>
                </div>
            </div>

            {/* selector de cliente */}
            <button
                onClick={() => navigate("/clientes")}
                className="mx-3 mb-1 flex items-center gap-2 rounded-md border border-line-2 bg-surface-2 px-2.5 py-2 text-left transition-colors hover:border-faint"
            >
                <Building2 size={15} className="flex-none text-accent" />
                <span className="min-w-0 flex-1">
                    <span className="block truncate text-[0.82rem] font-medium">
                        {clientCtx?.client?.companyName ?? "Elegir cliente"}
                    </span>
                    <span className="block truncate text-[0.68rem] text-faint">
                        {clientCtx?.client ? "Cliente activo" : "Ningún cliente seleccionado"}
                    </span>
                </span>
                <ChevronsUpDown size={14} className="flex-none text-faint" />
            </button>

            <nav className="flex-1 overflow-y-auto px-2 pb-2 hide-scrollbar">
                <div className="pt-2">
                    <Item to="/panel" label="Panel" icon={<LayoutDashboard size={s} />} />
                </div>

                <LineHeader title="Exposición · EASM" chip="Diseño" tone="bg-warn/15 text-warn" />
                <Item to="/exposicion" label="Evaluaciones" icon={<Radar size={s} />} />
                <Item to="/exposicion/pipeline" label="Pipeline" icon={<ChevronsUpDown size={s} />} />
                <Item to="/exposicion/hallazgos" label="Hallazgos" icon={<FileBarChart2 size={s} />} />
                <Item to="/exposicion/postura" label="Reporte de postura" icon={<Gauge size={s} />} />

                <LineHeader title="Concientización" chip="Activa" tone="bg-good/15 text-good" />
                <Item to="/concientizacion/empleados" label="Empleados" icon={<Users size={s} />} />
                <Item to="/concientizacion/curso" label="Curso" icon={<BookOpen size={s} />} />
                <Item to="/concientizacion/campanas" label="Campañas" icon={<Send size={s} />} />
                <Item to="/concientizacion/reportes" label="Reportes" icon={<FileBarChart2 size={s} />} />
                <Item to="/concientizacion/accesos" label="Accesos de cliente" icon={<ShieldCheck size={s} />} />

                <LineHeader title="Investigación y DD" chip="Pronto" tone="bg-surface-2 text-faint" />
                <Item to="/investigacion" label="Debida diligencia" icon={<Search size={s} />} disabled />

                <LineHeader title="Evaluación de riesgos" chip="Activa" tone="bg-good/15 text-good" />
                <Item to="/riesgos" label="Evaluaciones" icon={<ShieldAlert size={s} />} />
                <Item to="/catalogo-iso27001" label="Catálogo ISO 27001" icon={<Library size={s} />} />
            </nav>

            <div className="border-t border-line p-2.5">
                <div className="flex items-center gap-2.5 rounded-md px-1.5 py-1">
                    <span className="flex h-8 w-8 flex-none items-center justify-center rounded-lg bg-surface-2 text-[0.72rem] font-semibold text-ink">
                        {(auth?.username ?? "AT").slice(0, 2).toUpperCase()}
                    </span>
                    <div className="min-w-0 flex-1">
                        <p className="truncate text-[0.8rem] font-medium">{auth?.username ?? "Staff"}</p>
                        <p className="truncate text-[0.7rem] text-faint capitalize">{auth?.role ?? "operación"}</p>
                    </div>
                    <button
                        onClick={handleLogout}
                        aria-label="Cerrar sesión"
                        className="flex-none rounded-md p-1.5 text-faint transition-colors hover:bg-surface-2 hover:text-danger"
                    >
                        <LogOut size={16} />
                    </button>
                </div>
            </div>
        </aside>
    );
}
