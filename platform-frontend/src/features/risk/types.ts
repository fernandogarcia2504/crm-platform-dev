// Tipos de la línea Evaluación de Riesgos (ISO 27001:2022 / ISO 27005:2022).

export type Level = "Alto" | "Medio" | "Bajo";

export interface Dimension {
    key: string;
    label: string;
    description?: string;
    group?: string;
}

export interface ScaleItem {
    value: number;
    label: string;
    description?: string;
}

export interface Methodology {
    name: string;
    basis: string;
    probability: ScaleItem[];
    impactScale: ScaleItem[];
    riskImpactDimensions: Dimension[];
    opportunityImpactDimensions: Dimension[];
    impactAggregation: { method: "max" | "avg" | "maxAvg"; options: string[]; note: string };
    levels: { label: Level; min: number; color: string }[];
    assetCriticality: { value: number; label: string; operation: string; business: string }[];
    treatmentOptions: string[];
    treatmentStatus: string[];
    effectiveness: string[];
    monitoringFrequency: string[];
    defaultAcceptanceLevel: Level;
}

export interface Control {
    code: string;
    theme: string;
    themeName: string;
    name: string;
    nameEn: string;
    newIn2022: boolean;
}

export interface Threat {
    code: string;
    group: string;
    name: string;
    origin: string[];
    affects: string[];
    source: string;
}

export interface Vulnerability {
    code: string;
    assetType: string;
    name: string;
    suggestedControls: string[];
    clauses?: string[];
}

export interface RiskSource {
    code: string;
    name: string;
    type: string;
    description: string;
}

export interface DesiredEndState {
    code: string;
    name: string;
    description: string;
}

export interface Catalogs {
    methodology: Methodology;
    controls: Control[];
    threats: Threat[];
    vulnerabilities: Vulnerability[];
    riskSources: RiskSource[];
    desiredEndStates: DesiredEndState[];
}

export interface RiskSummary {
    totalRisks: number;
    inherentByLevel: Record<Level, number>;
    residualByLevel: Record<Level, number>;
    outsideAppetite: number;
    accepted: number;
    treatments: { total: number; implemented: number };
}

export type AssessmentStatus = "Planeada" | "En curso" | "Tratamiento" | "Completada";

export interface SoaOverride {
    applicable?: boolean;
    justification?: string;
    implementation?: string;
}

export interface Assessment {
    _id: string;
    crmCompanyId: string;
    companyName: string;
    crmProjectId?: string | null;
    crmProjectName?: string | null;
    name: string;
    scope?: string;
    context?: string;
    framework: string;
    methodology?: Methodology;
    acceptanceLevel: Level;
    status: AssessmentStatus;
    startDate?: string;
    endDate?: string;
    reviewFrequency?: string;
    nextReviewDate?: string;
    soaOverrides?: Record<string, SoaOverride>;
    notes?: string;
    summary?: RiskSummary;
    createdAt: string;
}

export interface Asset {
    _id: string;
    assessment: string;
    code: string;
    name: string;
    version?: string;
    type: string;
    usage?: string;
    owner?: string;
    service?: string;
    subService?: string;
    operationCriticality?: number;
    businessCriticality?: number;
    notes?: string;
}

export interface Evaluation {
    probability?: number;
    impacts: Record<string, number>;
    impact?: number | null;
    score?: number | null;
    level?: Level | null;
}

export interface Treatment {
    _id?: string;
    possibleActions?: string;
    actionTaken?: string;
    controlCode?: string;
    controlDetail?: string;
    description?: string;
    owner?: string;
    dueDate?: string;
    monitoringFrequency?: string;
    status: string;
    effectiveness: string;
    effectivenessDate?: string;
    evidence?: string;
    notes?: string;
}

export interface Risk {
    _id: string;
    assessment: string;
    asset: string;
    code: string;
    identifiedAt?: string;
    riskSourceCode?: string;
    desiredEndStateCode?: string;
    threatCode?: string;
    threatText?: string;
    vulnerabilityCode?: string;
    vulnerabilityText?: string;
    scenario: string;
    riskOwner?: string;
    inherent: Evaluation;
    treatmentOption?: string;
    treatments: Treatment[];
    residual: Evaluation;
    residualAccepted: boolean;
    acceptedBy?: string;
    acceptedAt?: string;
    withinAppetite?: boolean;
    notes?: string;
}

export interface Opportunity {
    _id: string;
    assessment: string;
    asset?: string | null;
    code: string;
    strength?: string;
    opportunity: string;
    scenario?: string;
    probability?: number;
    impacts: Record<string, number>;
    impact?: number | null;
    score?: number | null;
    level?: Level | null;
    possibleActions?: string;
    actionTaken?: string;
    treatment?: string;
    owner?: string;
    monitoringFrequency?: string;
    status: string;
    effectiveness: string;
    notes?: string;
}

export interface SoaRow {
    code: string;
    theme: string;
    name: string;
    newIn2022: boolean;
    applicable: boolean;
    justification: string;
    relatedRisks: string[];
    implementation: string;
    overridden: boolean;
}

export interface CrmProject {
    crmProjectId: string;
    name: string;
    line?: string;
    status?: string;
}

export interface AssessmentDetail {
    assessment: Assessment;
    assets: Asset[];
    risks: Risk[];
    opportunities: Opportunity[];
    summary: RiskSummary;
}
