import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";

import { motion } from "framer-motion";
import { Check, FileText, Video, LogOut, HelpCircle } from "lucide-react";

import { traineeApi } from "../../lib/api";
import Button from "../../components/ui/Button";
import { Spinner, ErrorText } from "../../components/ui/States";

interface PortalModule {
    id: string;
    title: string;
    description?: string;
    order: number;
    pdfUrl?: string | null;
    videoUrl?: string | null;
    hasQuiz: boolean;
    quiz: { question: string; options: string[] }[];
    completed: boolean;
    quizScore?: number | null;
}
interface PortalCourse {
    id: string;
    title: string;
    description?: string;
    progress: number;
    completed: boolean;
    modules: PortalModule[];
}

export default function TraineeCoursePage() {
    const navigate = useNavigate();
    const [course, setCourse] = useState<PortalCourse | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const { course } = await traineeApi.get<{ course: PortalCourse }>("/course-portal/course");
            setCourse(course);
        } catch (e) {
            setError(e instanceof Error ? e.message : "Error al cargar el curso");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const complete = async (moduleId: string) => {
        try {
            await traineeApi.post(`/course-portal/modules/${moduleId}/complete`);
            load();
        } catch (e) {
            setError(e instanceof Error ? e.message : "Error");
        }
    };

    const logout = () => {
        localStorage.removeItem("traineeToken");
        navigate("/portal");
    };

    return (
        <div className="min-h-screen w-full bg-canvas text-ink">
            <header className="border-b border-line bg-surface">
                <div className="mx-auto flex max-w-[840px] items-center justify-between px-6 py-3.5">
                    <div className="flex items-center gap-2.5">
                        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent">
                            <svg width="14" height="14" viewBox="0 0 26 26" fill="none">
                                <path d="M9 23 L10.5 9 H15.5 L17 23 Z" stroke="#fff" strokeWidth="1.8" strokeLinejoin="round" />
                                <path d="M8.5 15 H17.5" stroke="#fff" strokeWidth="1.5" />
                                <circle cx="13" cy="6.2" r="2.5" fill="#fff" />
                            </svg>
                        </span>
                        <span className="text-[0.95rem] font-semibold">Atalaya · Capacitación</span>
                    </div>
                    <button onClick={logout} className="flex items-center gap-1.5 text-[0.82rem] text-muted hover:text-danger">
                        <LogOut size={15} /> Salir
                    </button>
                </div>
            </header>

            <main className="mx-auto max-w-[840px] px-6 py-8">
                {loading && <Spinner label="Cargando tu curso..." />}
                {error && <ErrorText>{error}</ErrorText>}

                {!loading && !error && course && (
                    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
                        <h1 className="text-[1.5rem] font-semibold tracking-tight">{course.title}</h1>
                        <p className="mt-1 text-[0.9rem] text-muted">{course.description}</p>

                        <div className="mt-4 flex items-center gap-3">
                            <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-2">
                                <div className="h-full rounded-full bg-accent" style={{ width: `${course.progress}%` }} />
                            </div>
                            <span className="tnum text-[0.84rem] font-semibold">{course.progress}%</span>
                        </div>

                        <div className="mt-7 flex flex-col gap-3">
                            {course.modules.map((m, i) => (
                                <div key={m.id} className="rounded-lg border border-line bg-surface p-5">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex items-start gap-3">
                                            <span className={[
                                                "flex h-7 w-7 flex-none items-center justify-center rounded-full text-[0.78rem] font-semibold",
                                                m.completed ? "bg-good/15 text-good" : "bg-surface-2 text-muted"
                                            ].join(" ")}>
                                                {m.completed ? <Check size={14} /> : i + 1}
                                            </span>
                                            <div>
                                                <p className="text-[0.95rem] font-medium">{m.title}</p>
                                                {m.description && <p className="text-[0.82rem] text-muted">{m.description}</p>}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-3 flex flex-wrap items-center gap-2 pl-10">
                                        {m.videoUrl && (
                                            <a href={m.videoUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 rounded-md border border-line-2 px-2.5 py-1.5 text-[0.8rem] text-muted hover:text-ink">
                                                <Video size={14} /> Ver video
                                            </a>
                                        )}
                                        {m.pdfUrl && (
                                            <a href={m.pdfUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 rounded-md border border-line-2 px-2.5 py-1.5 text-[0.8rem] text-muted hover:text-ink">
                                                <FileText size={14} /> Material
                                            </a>
                                        )}
                                        {m.hasQuiz && (
                                            <span className="flex items-center gap-1.5 rounded-md bg-surface-2 px-2.5 py-1.5 text-[0.8rem] text-muted">
                                                <HelpCircle size={14} /> {m.quiz.length} preguntas
                                                {m.quizScore != null && <b className="ml-1 text-ink">· {m.quizScore}%</b>}
                                            </span>
                                        )}
                                        {!m.completed && !m.hasQuiz && (
                                            <Button size="sm" onClick={() => complete(m.id)}>Marcar completado</Button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </main>
        </div>
    );
}
