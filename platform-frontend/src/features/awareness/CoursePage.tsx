import { useEffect, useState, useCallback } from "react";

import { motion } from "framer-motion";
import { Plus, BookOpen } from "lucide-react";

import PageHeader from "../../components/ui/PageHeader";
import Button from "../../components/ui/Button";
import Badge from "../../components/ui/Badge";
import { Spinner, ErrorText, EmptyState } from "../../components/ui/States";
import ModuleEditor from "./ModuleEditor";
import type { Course } from "./types";
import { listCourses, createCourse, addModule, updateModule, deleteModule, uploadModulePdf, uploadModuleVideo } from "./services";

const input = "w-full rounded-md border border-line-2 bg-surface-2 px-3 py-2 text-[0.86rem] outline-none focus:border-accent";

export default function CoursePage() {
    const [courses, setCourses] = useState<Course[]>([]);
    const [selected, setSelected] = useState<Course | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [adding, setAdding] = useState(false);

    const load = useCallback(async (keepId?: string) => {
        try {
            setLoading(true);
            setError(null);
            const data = await listCourses();
            setCourses(data);
            setSelected((prev) => data.find((c) => c._id === (keepId ?? prev?._id)) ?? data[0] ?? null);
        } catch (e) {
            setError(e instanceof Error ? e.message : "Error al cargar cursos");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const handleCreateCourse = async () => {
        try {
            const c = await createCourse({ title: "Concientización en seguridad", description: "Curso base para colaboradores" });
            await load(c._id);
        } catch (e) { setError(e instanceof Error ? e.message : "Error"); }
    };

    const refreshSelected = (updated: Course) => {
        setSelected(updated);
        setCourses((cs) => cs.map((c) => (c._id === updated._id ? updated : c)));
    };

    return (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
            <PageHeader
                title="Curso"
                subtitle="Contenido de concientización para colaboradores"
                actions={<Button icon={<Plus size={15} />} onClick={handleCreateCourse}>Nuevo curso</Button>}
            />

            {loading && <Spinner label="Cargando curso..." />}
            {error && <ErrorText>{error}</ErrorText>}

            {!loading && !error && courses.length === 0 && (
                <div className="mt-8">
                    <EmptyState
                        icon={<BookOpen size={28} strokeWidth={1.5} />}
                        title="Sin curso"
                        hint="Crea el curso base que verán los colaboradores en su portal."
                        action={<Button icon={<Plus size={15} />} onClick={handleCreateCourse}>Nuevo curso</Button>}
                    />
                </div>
            )}

            {!loading && !error && selected && (
                <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-[220px_minmax(0,1fr)]">
                    <div className="flex flex-col gap-2">
                        {courses.map((c) => (
                            <button
                                key={c._id}
                                onClick={() => setSelected(c)}
                                className={["rounded-lg border px-3 py-2.5 text-left transition-colors", selected._id === c._id ? "border-accent/50 bg-surface" : "border-line hover:border-line-2"].join(" ")}
                            >
                                <p className="text-[0.86rem] font-medium">{c.title}</p>
                                <p className="text-[0.74rem] text-faint">{c.modules.length} módulo(s)</p>
                            </button>
                        ))}
                    </div>

                    <div>
                        <div className="mb-4 flex items-center justify-between">
                            <div>
                                <h2 className="text-[1rem] font-semibold">{selected.title}</h2>
                                <p className="text-[0.8rem] text-muted">{selected.description}</p>
                            </div>
                            <Badge tone={selected.active ? "good" : "neutral"}>{selected.active ? "Activo" : "Inactivo"}</Badge>
                        </div>

                        <div className="flex flex-col gap-2.5">
                            {[...selected.modules].sort((a, b) => a.order - b.order).map((m, i) => (
                                <ModuleEditor
                                    key={m._id}
                                    index={i}
                                    module={m}
                                    onUpdate={async (moduleId, data) => { refreshSelected(await updateModule(selected._id, moduleId, data)); }}
                                    onDelete={async (moduleId) => { refreshSelected(await deleteModule(selected._id, moduleId)); }}
                                    onUploadPdf={async (moduleId, file) => { refreshSelected(await uploadModulePdf(selected._id, moduleId, file)); }}
                                    onUploadVideo={async (moduleId, file) => { refreshSelected(await uploadModuleVideo(selected._id, moduleId, file)); }}
                                />
                            ))}
                            {selected.modules.length === 0 && (
                                <p className="rounded-lg border border-dashed border-line-2 py-8 text-center text-[0.84rem] text-faint">Sin módulos todavía</p>
                            )}
                        </div>

                        {adding ? (
                            <AddModuleForm
                                onCancel={() => setAdding(false)}
                                onSave={async (body) => {
                                    refreshSelected(await addModule(selected._id, { ...body, order: selected.modules.length }));
                                    setAdding(false);
                                }}
                            />
                        ) : (
                            <Button variant="secondary" size="sm" icon={<Plus size={14} />} className="mt-4" onClick={() => setAdding(true)}>Agregar módulo</Button>
                        )}
                        <p className="mt-3 text-[0.74rem] text-faint">Crea el módulo y luego edítalo (lápiz) para agregarle quiz y material.</p>
                    </div>
                </div>
            )}
        </motion.div>
    );
}

function AddModuleForm({ onSave, onCancel }: { onSave: (b: Record<string, unknown>) => void; onCancel: () => void }) {
    const [form, setForm] = useState({ title: "", description: "" });
    return (
        <div className="mt-4 flex flex-col gap-2.5 rounded-lg border border-line-2 bg-surface-2 p-4">
            <input className={input} placeholder="Título del módulo" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            <input className={input} placeholder="Descripción" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <div className="flex justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={onCancel}>Cancelar</Button>
                <Button size="sm" disabled={!form.title} onClick={() => onSave(form)}>Agregar</Button>
            </div>
        </div>
    );
}
