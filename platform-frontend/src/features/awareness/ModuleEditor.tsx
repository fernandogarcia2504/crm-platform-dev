import { useRef, useState } from "react";
import { Pencil, Trash2, Plus, X, FileText, Video, HelpCircle, ChevronDown, ChevronUp, Check, Upload } from "lucide-react";

import Button from "../../components/ui/Button";
import type { CourseModule, QuizQuestion } from "./types";

interface Props {
    index: number;
    module: CourseModule;
    onUpdate: (moduleId: string, data: Record<string, unknown>) => Promise<void>;
    onDelete: (moduleId: string) => Promise<void>;
    onUploadPdf: (moduleId: string, file: File) => Promise<void>;
    onUploadVideo: (moduleId: string, file: File) => Promise<void>;
}

const emptyQuestion = (): QuizQuestion => ({ question: "", options: ["", ""], correctIndex: 0 });
const input = "w-full rounded-md border border-line-2 bg-surface-2 px-3 py-2 text-[0.86rem] outline-none focus:border-accent";

export default function ModuleEditor({ index, module, onUpdate, onDelete, onUploadPdf, onUploadVideo }: Props) {
    const [expanded, setExpanded] = useState(false);
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [err, setErr] = useState<string | null>(null);
    const [uploading, setUploading] = useState<"pdf" | "video" | null>(null);

    const pdfRef = useRef<HTMLInputElement>(null);
    const videoRef = useRef<HTMLInputElement>(null);

    const [title, setTitle] = useState(module.title);
    const [description, setDescription] = useState(module.description ?? "");
    const [order, setOrder] = useState(module.order);
    const [passingScore, setPassingScore] = useState(module.passingScore ?? 80);
    const [videoExternalUrl, setVideoExternalUrl] = useState(module.video?.externalUrl ?? "");
    const [quiz, setQuiz] = useState<QuizQuestion[]>(module.quiz ?? []);

    const reset = () => {
        setTitle(module.title); setDescription(module.description ?? ""); setOrder(module.order);
        setPassingScore(module.passingScore ?? 80); setVideoExternalUrl(module.video?.externalUrl ?? ""); setQuiz(module.quiz ?? []);
    };
    const start = () => { reset(); setEditing(true); setExpanded(true); setErr(null); };
    const cancel = () => { reset(); setEditing(false); setErr(null); };

    const save = async () => {
        if (!title.trim()) { setErr("El título es requerido"); return; }
        try {
            setSaving(true); setErr(null);
            await onUpdate(module._id, {
                title, description, order, passingScore, videoExternalUrl,
                quiz: quiz.filter((q) => q.question.trim() && q.options.every((o) => o.trim()))
            });
            setEditing(false);
        } catch (e) { setErr(e instanceof Error ? e.message : "Error al guardar"); } finally { setSaving(false); }
    };

    const doUpload = async (kind: "pdf" | "video", file?: File) => {
        if (!file) return;
        try {
            setUploading(kind); setErr(null);
            if (kind === "pdf") await onUploadPdf(module._id, file);
            else await onUploadVideo(module._id, file);
        } catch (e) { setErr(e instanceof Error ? e.message : "Error al subir"); } finally {
            setUploading(null);
            if (pdfRef.current) pdfRef.current.value = "";
            if (videoRef.current) videoRef.current.value = "";
        }
    };

    // quiz helpers
    const addQ = () => setQuiz((c) => [...c, emptyQuestion()]);
    const rmQ = (i: number) => setQuiz((c) => c.filter((_, x) => x !== i));
    const setQText = (i: number, v: string) => setQuiz((c) => c.map((q, x) => x === i ? { ...q, question: v } : q));
    const setOpt = (qi: number, oi: number, v: string) => setQuiz((c) => c.map((q, x) => x === qi ? { ...q, options: q.options.map((o, y) => y === oi ? v : o) } : q));
    const addOpt = (qi: number) => setQuiz((c) => c.map((q, x) => x === qi ? { ...q, options: [...q.options, ""] } : q));
    const rmOpt = (qi: number, oi: number) => setQuiz((c) => c.map((q, x) => {
        if (x !== qi) return q;
        const options = q.options.filter((_, y) => y !== oi);
        return { ...q, options, correctIndex: q.correctIndex === oi ? 0 : q.correctIndex };
    }));
    const setCorrect = (qi: number, oi: number) => setQuiz((c) => c.map((q, x) => x === qi ? { ...q, correctIndex: oi } : q));

    const hasPdf = Boolean(module.pdf?.s3Key);
    const hasVideo = Boolean(module.video?.s3Key || module.video?.externalUrl);

    return (
        <div className="rounded-lg border border-line bg-surface">
            <div className="flex items-center justify-between px-4 py-3">
                <button onClick={() => setExpanded((v) => !v)} className="flex min-w-0 items-center gap-3 text-left">
                    <span className="flex h-7 w-7 flex-none items-center justify-center rounded-md bg-surface-2 text-[0.76rem] font-semibold text-muted">{index + 1}</span>
                    <span className="min-w-0">
                        <span className="block truncate text-[0.9rem] font-medium">{module.title}</span>
                        <span className="flex items-center gap-2 text-faint">
                            {hasPdf && <FileText size={13} />}
                            {hasVideo && <Video size={13} />}
                            {module.quiz && module.quiz.length > 0 && (<span className="flex items-center gap-1 text-[0.72rem]"><HelpCircle size={13} />{module.quiz.length}</span>)}
                        </span>
                    </span>
                </button>
                <div className="flex items-center gap-2">
                    <button onClick={start} title="Editar" className="rounded p-1.5 text-faint hover:bg-surface-2 hover:text-accent"><Pencil size={14} /></button>
                    <button onClick={() => onDelete(module._id)} title="Eliminar" className="rounded p-1.5 text-faint hover:bg-surface-2 hover:text-danger"><Trash2 size={14} /></button>
                    <button onClick={() => setExpanded((v) => !v)} className="rounded p-1.5 text-faint hover:bg-surface-2">{expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}</button>
                </div>
            </div>

            {expanded && (
                <div className="border-t border-line p-4">
                    {!editing ? (
                        <div className="flex flex-col gap-2 text-[0.84rem] text-muted">
                            {module.description && <p>{module.description}</p>}
                            {hasPdf && <p className="flex items-center gap-1.5"><FileText size={13} className="text-faint" /> {module.pdf?.originalName}</p>}
                            {module.video?.s3Key && <p className="flex items-center gap-1.5"><Video size={13} className="text-faint" /> {module.video.originalName}</p>}
                            {module.video?.externalUrl && <p className="truncate"><span className="text-faint">Video:</span> {module.video.externalUrl}</p>}
                            {module.quiz && module.quiz.length > 0 ? (
                                <div className="mt-1">
                                    <p className="mb-1 text-[0.78rem] font-semibold text-ink">Quiz · aprobación {module.passingScore ?? 80}%</p>
                                    <ol className="list-decimal pl-5">
                                        {module.quiz.map((q, i) => (<li key={i} className="mb-1"><span className="text-ink">{q.question}</span><span className="text-faint"> — {q.options.length} opciones</span></li>))}
                                    </ol>
                                </div>
                            ) : <p className="text-faint">Sin quiz</p>}
                        </div>
                    ) : (
                        <div className="flex flex-col gap-3">
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                <Field label="Título"><input className={input} value={title} onChange={(e) => setTitle(e.target.value)} /></Field>
                                <Field label="Orden"><input type="number" className={input} value={order} onChange={(e) => setOrder(Number(e.target.value))} /></Field>
                            </div>
                            <Field label="Descripción"><input className={input} value={description} onChange={(e) => setDescription(e.target.value)} /></Field>

                            {/* material: subida a S3 */}
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                <div className="flex flex-col gap-1.5">
                                    <span className="text-[0.78rem] text-muted">PDF (se sube a S3)</span>
                                    <input ref={pdfRef} type="file" accept="application/pdf" className="hidden" onChange={(e) => doUpload("pdf", e.target.files?.[0])} />
                                    <Button variant="secondary" size="sm" icon={<Upload size={14} />} disabled={uploading === "pdf"} onClick={() => pdfRef.current?.click()}>
                                        {uploading === "pdf" ? "Subiendo..." : hasPdf ? "Reemplazar PDF" : "Subir PDF"}
                                    </Button>
                                    {hasPdf && <span className="truncate text-[0.74rem] text-faint">{module.pdf?.originalName}</span>}
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <span className="text-[0.78rem] text-muted">Video (archivo a S3)</span>
                                    <input ref={videoRef} type="file" accept="video/mp4,video/webm,video/quicktime" className="hidden" onChange={(e) => doUpload("video", e.target.files?.[0])} />
                                    <Button variant="secondary" size="sm" icon={<Upload size={14} />} disabled={uploading === "video"} onClick={() => videoRef.current?.click()}>
                                        {uploading === "video" ? "Subiendo..." : module.video?.s3Key ? "Reemplazar video" : "Subir video"}
                                    </Button>
                                    {module.video?.s3Key && <span className="truncate text-[0.74rem] text-faint">{module.video.originalName}</span>}
                                </div>
                            </div>
                            <Field label="…o URL de video externo (Vimeo/YouTube no listado)"><input className={input} value={videoExternalUrl} onChange={(e) => setVideoExternalUrl(e.target.value)} placeholder="https://..." /></Field>

                            {/* quiz editor */}
                            <div className="rounded-lg border border-line-2 bg-surface-2 p-3.5">
                                <div className="mb-2 flex items-center justify-between">
                                    <div className="flex items-center gap-2"><HelpCircle size={15} className="text-accent" /><p className="text-[0.86rem] font-semibold">Quiz</p></div>
                                    <label className="flex items-center gap-1.5 text-[0.76rem] text-muted">Aprobación
                                        <input type="number" min={0} max={100} value={passingScore} onChange={(e) => setPassingScore(Number(e.target.value))} className="w-16 rounded border border-line-2 bg-surface px-2 py-1 text-[0.8rem] outline-none focus:border-accent" />%
                                    </label>
                                </div>
                                <div className="flex flex-col gap-3">
                                    {quiz.map((q, qi) => (
                                        <div key={qi} className="rounded-md border border-line bg-surface p-3">
                                            <div className="flex items-center gap-2">
                                                <input className={input} placeholder={`Pregunta ${qi + 1}`} value={q.question} onChange={(e) => setQText(qi, e.target.value)} />
                                                <button onClick={() => rmQ(qi)} className="flex-none rounded p-1.5 text-faint hover:text-danger"><X size={15} /></button>
                                            </div>
                                            <div className="mt-2 flex flex-col gap-1.5 pl-1">
                                                {q.options.map((opt, oi) => (
                                                    <div key={oi} className="flex items-center gap-2">
                                                        <button onClick={() => setCorrect(qi, oi)} title="Marcar como correcta" className={["flex h-5 w-5 flex-none items-center justify-center rounded-full border", q.correctIndex === oi ? "border-good bg-good/20 text-good" : "border-line-2 text-transparent hover:border-faint"].join(" ")}><Check size={12} /></button>
                                                        <input className={`${input} py-1.5`} placeholder={`Opción ${oi + 1}`} value={opt} onChange={(e) => setOpt(qi, oi, e.target.value)} />
                                                        {q.options.length > 2 && (<button onClick={() => rmOpt(qi, oi)} className="flex-none rounded p-1 text-faint hover:text-danger"><X size={13} /></button>)}
                                                    </div>
                                                ))}
                                                <button onClick={() => addOpt(qi)} className="mt-1 w-fit text-[0.76rem] text-accent hover:underline">+ opción</button>
                                            </div>
                                        </div>
                                    ))}
                                    <Button variant="secondary" size="sm" icon={<Plus size={14} />} onClick={addQ} className="w-fit">Agregar pregunta</Button>
                                </div>
                            </div>

                            {err && <p className="text-[0.8rem] text-danger">{err}</p>}
                            <div className="flex justify-end gap-2">
                                <Button variant="ghost" size="sm" onClick={cancel}>Cancelar</Button>
                                <Button size="sm" disabled={saving} onClick={save}>{saving ? "Guardando..." : "Guardar módulo"}</Button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <label className="flex flex-col gap-1.5">
            <span className="text-[0.78rem] text-muted">{label}</span>
            {children}
        </label>
    );
}
