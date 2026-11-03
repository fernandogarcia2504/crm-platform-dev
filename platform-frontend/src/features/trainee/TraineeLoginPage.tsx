import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

import { motion } from "framer-motion";

import { API_BASE } from "../../lib/api";
import Button from "../../components/ui/Button";

export default function TraineeLoginPage() {
    const navigate = useNavigate();
    const [form, setForm] = useState({ username: "", password: "" });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const submit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/course-auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form)
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Credenciales inválidas");
            localStorage.setItem("traineeToken", data.token);
            localStorage.setItem("traineeName", data.employee?.fullName ?? "");
            navigate("/portal/curso");
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Error al iniciar sesión");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen w-full items-center justify-center bg-canvas px-6 text-ink">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="w-full max-w-[380px]">
                <div className="mb-8 flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent">
                        <svg width="19" height="19" viewBox="0 0 26 26" fill="none">
                            <path d="M9 23 L10.5 9 H15.5 L17 23 Z" stroke="#fff" strokeWidth="1.8" strokeLinejoin="round" />
                            <path d="M8.5 15 H17.5" stroke="#fff" strokeWidth="1.5" />
                            <circle cx="13" cy="6.2" r="2.5" fill="#fff" />
                        </svg>
                    </span>
                    <span className="text-[1.05rem] font-semibold tracking-tight">Atalaya · Capacitación</span>
                </div>

                <form onSubmit={submit} className="flex flex-col gap-5">
                    <div>
                        <h1 className="text-[1.4rem] font-semibold tracking-tight">Portal de cursos</h1>
                        <p className="text-[0.85rem] text-muted">Ingresa con las credenciales que te compartieron</p>
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <label className="text-[0.8rem] font-medium text-muted">Usuario</label>
                        <input className="w-full rounded-md border border-line-2 bg-surface-2 px-3 py-2 text-[0.9rem] outline-none focus:border-accent"
                            value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} placeholder="tu correo" required />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <label className="text-[0.8rem] font-medium text-muted">Contraseña</label>
                        <input type="password" className="w-full rounded-md border border-line-2 bg-surface-2 px-3 py-2 text-[0.9rem] outline-none focus:border-accent"
                            value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="••••••••" required />
                    </div>
                    {error && <p className="text-[0.82rem] text-danger">{error}</p>}
                    <Button type="submit" disabled={loading} className="w-full">{loading ? "Entrando..." : "Entrar"}</Button>
                    <p className="text-center text-[0.8rem] text-faint">
                        ¿Eres del equipo Atalaya? <Link to="/" className="text-accent hover:underline">Consola</Link>
                    </p>
                </form>
            </motion.div>
        </div>
    );
}
