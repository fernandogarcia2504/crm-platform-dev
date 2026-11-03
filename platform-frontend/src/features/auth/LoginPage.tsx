import React, { useState, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";

import { motion } from "framer-motion";

import { AuthContext } from "../../app/context/AuthContext";
import { API_BASE } from "../../lib/api";
import Button from "../../components/ui/Button";

export default function LoginPage() {

    const navigate = useNavigate();
    const auth = useContext(AuthContext);

    const [formData, setFormData] = useState({ username: "", password: "" });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Credenciales incorrectas");

            auth?.login(data.token, data.user.username, data.user.role);
            navigate("/panel");
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Ocurrió un error al iniciar sesión");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen w-full bg-canvas text-ink">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6 }}
                className="relative hidden w-1/2 flex-col justify-between overflow-hidden border-r border-line bg-surface p-12 lg:flex"
            >
                <div
                    className="pointer-events-none absolute inset-0 opacity-50"
                    style={{ backgroundImage: "radial-gradient(60% 50% at 25% 15%, rgba(91,116,255,0.16), transparent 70%)" }}
                />
                <div className="relative flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent">
                        <svg width="19" height="19" viewBox="0 0 26 26" fill="none">
                            <path d="M9 23 L10.5 9 H15.5 L17 23 Z" stroke="#fff" strokeWidth="1.8" strokeLinejoin="round" />
                            <path d="M8.5 15 H17.5" stroke="#fff" strokeWidth="1.5" />
                            <circle cx="13" cy="6.2" r="2.5" fill="#fff" />
                        </svg>
                    </span>
                    <span className="text-[1.1rem] font-semibold tracking-tight">Atalaya · Operación</span>
                </div>
                <div className="relative">
                    <h2 className="max-w-[420px] text-[1.9rem] font-semibold leading-tight tracking-tight">
                        Donde se ejecutan las líneas de seguridad.
                    </h2>
                    <p className="mt-3 max-w-[380px] text-[0.95rem] text-muted">
                        Exposición, concientización, investigación y riesgos — cada una con su propia operación.
                    </p>
                </div>
                <p className="relative text-[0.78rem] text-faint">© {new Date().getFullYear()} Atalaya</p>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                className="flex w-full flex-col items-center justify-center px-6 lg:w-1/2"
            >
                <form onSubmit={handleSubmit} className="flex w-full max-w-[380px] flex-col gap-5">
                    <div className="flex flex-col gap-1">
                        <h1 className="text-[1.5rem] font-semibold tracking-tight">Consola de operación</h1>
                        <p className="text-[0.85rem] text-muted">Inicia sesión con tu usuario del CRM</p>
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-[0.8rem] font-medium text-muted">Usuario</label>
                        <input
                            name="username" value={formData.username} onChange={handleChange} type="text"
                            className="w-full rounded-md border border-line-2 bg-surface-2 px-3 py-2 text-[0.9rem] outline-none transition-colors focus:border-accent"
                            placeholder="usuario" required
                        />
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-[0.8rem] font-medium text-muted">Contraseña</label>
                        <input
                            name="password" value={formData.password} onChange={handleChange} type="password"
                            className="w-full rounded-md border border-line-2 bg-surface-2 px-3 py-2 text-[0.9rem] outline-none transition-colors focus:border-accent"
                            placeholder="••••••••" required
                        />
                    </div>

                    {error && <p className="text-[0.82rem] text-danger">{error}</p>}

                    <Button type="submit" disabled={loading} className="mt-2 w-full">
                        {loading ? "Iniciando sesión..." : "Entrar"}
                    </Button>

                    <p className="text-center text-[0.8rem] text-faint">
                        ¿Eres colaborador en capacitación?{" "}
                        <Link to="/portal" className="text-accent hover:underline">Portal de cursos</Link>
                    </p>
                </form>
            </motion.div>
        </div>
    );
}
