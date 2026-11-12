import { useState } from "react";
import { Plus, Boxes, Trash2 } from "lucide-react";

import Button from "../../components/ui/Button";
import { EmptyState } from "../../components/ui/States";
import type { Asset, Methodology, Risk } from "./types";
import { createAsset, updateAsset, deleteAsset } from "./services";
import { Modal, Field } from "./RiskUi";
import { input, errMsg } from "./riskHelpers";

const ASSET_TYPES = ["Información", "Hardware", "Software", "Red", "Personal", "Sitio / instalaciones", "Organización", "Servicio", "Proveedor"];

export default function AssetsTab({ assessmentId, methodology, assets, risks, onChanged }: {
    assessmentId: string; methodology: Methodology; assets: Asset[]; risks: Risk[]; onChanged: () => void;
}) {
    const [editing, setEditing] = useState<Asset | "new" | null>(null);
    const critLabel = (v?: number) => methodology.assetCriticality.find((c) => c.value === v)?.label ?? "—";
    const riskCount = (id: string) => risks.filter((r) => r.asset === id).length;

    return (
        <div className="mt-5">
            <div className="mb-3 flex items-center justify-between">
                <p className="text-[0.82rem] text-muted">Inventario de activos dentro del alcance. Cada riesgo se identifica sobre un activo.</p>
                <Button size="sm" icon={<Plus size={14} />} onClick={() => setEditing("new")}>Nuevo activo</Button>
            </div>

            {assets.length === 0 ? (
                <EmptyState
                    icon={<Boxes size={28} strokeWidth={1.5} />}
                    title="Sin activos"
                    hint="Empieza por el inventario: información, sistemas, red, personal, instalaciones y proveedores."
                    action={<Button size="sm" icon={<Plus size={14} />} onClick={() => setEditing("new")}>Nuevo activo</Button>}
                />
            ) : (
                <div className="overflow-x-auto rounded-lg border border-line">
                    <table className="w-full text-left text-[0.83rem]">
                        <thead className="bg-surface text-[0.72rem] uppercase tracking-wide text-faint">
                            <tr>
                                <th className="px-3 py-2.5">ID</th>
                                <th className="px-3 py-2.5">Activo</th>
                                <th className="px-3 py-2.5">Tipo</th>
                                <th className="px-3 py-2.5">Dueño</th>
                                <th className="px-3 py-2.5">Crit. operación</th>
                                <th className="px-3 py-2.5">Crit. negocio</th>
                                <th className="px-3 py-2.5 text-right">Riesgos</th>
                            </tr>
                        </thead>
                        <tbody>
                            {assets.map((a) => (
                                <tr key={a._id} onClick={() => setEditing(a)} className="cursor-pointer border-t border-line hover:bg-surface-2/50">
                                    <td className="tnum whitespace-nowrap px-3 py-2.5 text-muted">{a.code}</td>
                                    <td className="px-3 py-2.5">
                                        <span className="font-medium">{a.name}</span>
                                        {a.version && <span className="ml-1.5 text-[0.74rem] text-faint">v{a.version}</span>}
                                    </td>
                                    <td className="px-3 py-2.5 text-muted">{a.type}</td>
                                    <td className="px-3 py-2.5 text-muted">{a.owner ?? "—"}</td>
                                    <td className="px-3 py-2.5">{critLabel(a.operationCriticality)}</td>
                                    <td className="px-3 py-2.5">{critLabel(a.businessCriticality)}</td>
                                    <td className="tnum px-3 py-2.5 text-right">{riskCount(a._id)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {editing && (
                <AssetModal
                    assessmentId={assessmentId}
                    methodology={methodology}
                    asset={editing === "new" ? null : editing}
                    onClose={() => setEditing(null)}
                    onSaved={() => { setEditing(null); onChanged(); }}
                />
            )}
        </div>
    );
}

function AssetModal({ assessmentId, methodology, asset, onClose, onSaved }: {
    assessmentId: string; methodology: Methodology; asset: Asset | null; onClose: () => void; onSaved: () => void;
}) {
    const [f, setF] = useState<Partial<Asset>>(asset ?? { type: "Información" });
    const [saving, setSaving] = useState(false);
    const [err, setErr] = useState<string | null>(null);
    const set = (k: keyof Asset, v: unknown) => setF((p) => ({ ...p, [k]: v }));

    const save = async () => {
        if (!f.name) { setErr("El nombre es requerido"); return; }
        try {
            setSaving(true);
            if (asset) await updateAsset(asset._id, f);
            else await createAsset(assessmentId, f);
            onSaved();
        } catch (e) {
            setErr(errMsg(e, "Error al guardar"));
        } finally {
            setSaving(false);
        }
    };

    const remove = async () => {
        if (!asset || !confirm(`¿Eliminar el activo ${asset.code}?`)) return;
        try {
            await deleteAsset(asset._id);
            onSaved();
        } catch (e) {
            setErr(errMsg(e, "Error al eliminar"));
        }
    };

    const crit = (k: "operationCriticality" | "businessCriticality", help: "operation" | "business") => (
        <select className={input} value={f[k] ?? ""} onChange={(e) => set(k, e.target.value ? Number(e.target.value) : undefined)}>
            <option value="">—</option>
            {methodology.assetCriticality.map((c) => (
                <option key={c.value} value={c.value} title={c[help]}>{c.value} · {c.label}</option>
            ))}
        </select>
    );

    return (
        <Modal
            title={asset ? `Activo ${asset.code}` : "Nuevo activo"}
            onClose={onClose}
            footer={<>
                {err && <p className="mr-auto self-center text-[0.8rem] text-danger">{err}</p>}
                {asset && <Button variant="danger" size="sm" icon={<Trash2 size={14} />} onClick={remove}>Eliminar</Button>}
                <Button variant="ghost" size="sm" onClick={onClose}>Cancelar</Button>
                <Button size="sm" disabled={saving} onClick={save}>{saving ? "Guardando..." : "Guardar"}</Button>
            </>}
        >
            <div className="grid grid-cols-2 gap-3">
                <Field label="ID de activo" hint={asset ? undefined : "Vacío = consecutivo automático"}>
                    <input className={input} value={f.code ?? ""} onChange={(e) => set("code", e.target.value)} placeholder="ACT-001" />
                </Field>
                <Field label="Tipo">
                    <select className={input} value={f.type} onChange={(e) => set("type", e.target.value)}>
                        {ASSET_TYPES.map((t) => <option key={t}>{t}</option>)}
                    </select>
                </Field>
                <Field label="Nombre del activo" className="col-span-2">
                    <input className={input} value={f.name ?? ""} onChange={(e) => set("name", e.target.value)} />
                </Field>
                <Field label="Versión">
                    <input className={input} value={f.version ?? ""} onChange={(e) => set("version", e.target.value)} />
                </Field>
                <Field label="Tipo de uso">
                    <input className={input} value={f.usage ?? ""} onChange={(e) => set("usage", e.target.value)} placeholder="Productivo, soporte, respaldo..." />
                </Field>
                <Field label="Dueño del activo">
                    <input className={input} value={f.owner ?? ""} onChange={(e) => set("owner", e.target.value)} />
                </Field>
                <Field label="Servicio que soporta">
                    <input className={input} value={f.service ?? ""} onChange={(e) => set("service", e.target.value)} />
                </Field>
                <Field label="Criticidad en la operación">{crit("operationCriticality", "operation")}</Field>
                <Field label="Criticidad en el negocio">{crit("businessCriticality", "business")}</Field>
                <Field label="Notas" className="col-span-2">
                    <textarea className={`${input} min-h-[56px]`} value={f.notes ?? ""} onChange={(e) => set("notes", e.target.value)} />
                </Field>
            </div>
        </Modal>
    );
}
