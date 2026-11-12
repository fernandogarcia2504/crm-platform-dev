import { api } from "../../lib/api";
import type {
    Catalogs, Assessment, AssessmentDetail, Asset, Risk, Opportunity, SoaRow, CrmProject
} from "./types";

// --- Catálogos (se piden una vez y se reutilizan en toda la sesión) ---
let catalogsCache: Promise<Catalogs> | null = null;

export const getCatalogs = () => {
    if (!catalogsCache) {
        catalogsCache = api.get<{ catalogs: Catalogs }>(`/risk/catalogs`)
            .then((r) => r.catalogs)
            .catch((e) => { catalogsCache = null; throw e; });
    }
    return catalogsCache;
};

// --- Proyectos del CRM con línea "Riesgos" (puente de lectura) ---
export const listRiskProjects = (crmCompanyId: string) =>
    api.get<{ projects: CrmProject[] }>(`/crm/companies/${crmCompanyId}/projects?line=Riesgos`)
        .then((r) => r.projects);

// --- Evaluaciones ---
export const listAssessments = (crmCompanyId: string) =>
    api.get<{ assessments: Assessment[] }>(`/risk/assessments/company/${crmCompanyId}`).then((r) => r.assessments);

export const getAssessment = (assessmentId: string) =>
    api.get<AssessmentDetail>(`/risk/assessments/${assessmentId}`);

export const createAssessment = (body: Record<string, unknown>) =>
    api.post<{ assessment: Assessment }>(`/risk/assessments`, body).then((r) => r.assessment);

export const updateAssessment = (assessmentId: string, body: Record<string, unknown>) =>
    api.put<{ assessment: Assessment }>(`/risk/assessments/${assessmentId}`, body).then((r) => r.assessment);

export const deleteAssessment = (assessmentId: string) =>
    api.del<{ message: string }>(`/risk/assessments/${assessmentId}`);

export const getSoA = (assessmentId: string) =>
    api.get<{ soa: SoaRow[] }>(`/risk/assessments/${assessmentId}/soa`).then((r) => r.soa);

// --- Activos ---
export const createAsset = (assessmentId: string, body: Partial<Asset>) =>
    api.post<{ asset: Asset }>(`/risk/assessments/${assessmentId}/assets`, body).then((r) => r.asset);

export const updateAsset = (assetId: string, body: Partial<Asset>) =>
    api.put<{ asset: Asset }>(`/risk/assets/${assetId}`, body).then((r) => r.asset);

export const deleteAsset = (assetId: string) => api.del<{ message: string }>(`/risk/assets/${assetId}`);

// --- Riesgos ---
export const createRisk = (assessmentId: string, body: Partial<Risk>) =>
    api.post<{ risk: Risk }>(`/risk/assessments/${assessmentId}/risks`, body).then((r) => r.risk);

export const updateRisk = (riskId: string, body: Partial<Risk>) =>
    api.put<{ risk: Risk }>(`/risk/risks/${riskId}`, body).then((r) => r.risk);

export const deleteRisk = (riskId: string) => api.del<{ message: string }>(`/risk/risks/${riskId}`);

// --- Oportunidades ---
export const createOpportunity = (assessmentId: string, body: Partial<Opportunity>) =>
    api.post<{ opportunity: Opportunity }>(`/risk/assessments/${assessmentId}/opportunities`, body)
        .then((r) => r.opportunity);

export const updateOpportunity = (opportunityId: string, body: Partial<Opportunity>) =>
    api.put<{ opportunity: Opportunity }>(`/risk/opportunities/${opportunityId}`, body).then((r) => r.opportunity);

export const deleteOpportunity = (opportunityId: string) =>
    api.del<{ message: string }>(`/risk/opportunities/${opportunityId}`);
