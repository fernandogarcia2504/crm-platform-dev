import { api, API_BASE } from "../../lib/api";
import type { Employee, Course, Campaign } from "./types";

// Subida multipart (FormData) — no se puede usar `api` porque fija
// Content-Type JSON. El backend guarda el archivo en S3 y devuelve course.
const uploadFile = async (path: string, file: File): Promise<Course> => {
    const token = localStorage.getItem("token");
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch(`${API_BASE}${path}`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: fd
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error((data as { message?: string }).message || "Error al subir el archivo");
    return (data as { course: Course }).course;
};

// --- Empleados ---
export const listEmployees = (crmCompanyId: string) =>
    api.get<{ employees: Employee[] }>(`/employees/company/${crmCompanyId}`).then((r) => r.employees);

export const createEmployee = (body: Record<string, unknown>) =>
    api.post<{ employee: Employee }>(`/employees`, body).then((r) => r.employee);

export const regenerateCredentials = (crmCompanyId: string, employeeId: string) =>
    api.post<{ employee: Employee }>(`/employees/company/${crmCompanyId}/${employeeId}/regenerate`)
        .then((r) => r.employee);

export const deleteEmployee = (crmCompanyId: string, employeeId: string) =>
    api.del<{ message: string }>(`/employees/company/${crmCompanyId}/${employeeId}`);

// --- Curso ---
export const listCourses = () => api.get<{ courses: Course[] }>(`/courses`).then((r) => r.courses);

export const createCourse = (body: Record<string, unknown>) =>
    api.post<{ course: Course }>(`/courses`, body).then((r) => r.course);

export const updateCourse = (courseId: string, body: Record<string, unknown>) =>
    api.put<{ course: Course }>(`/courses/${courseId}`, body).then((r) => r.course);

export const addModule = (courseId: string, body: Record<string, unknown>) =>
    api.post<{ course: Course }>(`/courses/${courseId}/modules`, body).then((r) => r.course);

export const updateModule = (courseId: string, moduleId: string, body: Record<string, unknown>) =>
    api.put<{ course: Course }>(`/courses/${courseId}/modules/${moduleId}`, body).then((r) => r.course);

export const deleteModule = (courseId: string, moduleId: string) =>
    api.del<{ course: Course }>(`/courses/${courseId}/modules/${moduleId}`).then((r) => r.course);

export const uploadModulePdf = (courseId: string, moduleId: string, file: File) =>
    uploadFile(`/courses/${courseId}/modules/${moduleId}/pdf`, file);

export const uploadModuleVideo = (courseId: string, moduleId: string, file: File) =>
    uploadFile(`/courses/${courseId}/modules/${moduleId}/video`, file);

// --- Campañas ---
export const listCampaigns = (crmCompanyId: string) =>
    api.get<{ campaigns: Campaign[] }>(`/campaigns/company/${crmCompanyId}`).then((r) => r.campaigns);

export const getCampaign = (campaignId: string) =>
    api.get<{ campaign: Campaign }>(`/campaigns/${campaignId}`).then((r) => r.campaign);

export const createCampaign = (body: Record<string, unknown>) =>
    api.post<{ campaign: Campaign }>(`/campaigns`, body).then((r) => r.campaign);

export const updateCampaign = (campaignId: string, body: Record<string, unknown>) =>
    api.put<{ campaign: Campaign }>(`/campaigns/${campaignId}`, body).then((r) => r.campaign);

export const setTargetEvent = (
    campaignId: string,
    targetId: string,
    event: string,
    value: boolean
) =>
    api.patch<{ campaign: Campaign }>(`/campaigns/${campaignId}/targets/${targetId}`, { event, value })
        .then((r) => r.campaign);

// Lanza la campaña en Gophish (crea el grupo con los objetivos y lanza).
export const launchCampaign = (campaignId: string) =>
    api.post<{ campaign: Campaign; message: string }>(`/campaigns/${campaignId}/launch`);

// Trae los resultados de Gophish y actualiza el embudo.
export const syncCampaign = (campaignId: string) =>
    api.post<{ campaign: Campaign; message: string }>(`/campaigns/${campaignId}/sync`).then((r) => r.campaign);

// --- Reporte ---
export const generateReport = (campaignId: string) =>
    api.get<{ report: Record<string, unknown>; html: string }>(`/reports/campaign/${campaignId}`);
