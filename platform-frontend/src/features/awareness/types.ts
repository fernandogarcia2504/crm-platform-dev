export interface CourseAccount {
    username?: string;
    enrolled: boolean;
    completed: boolean;
    progress: number;
    mustChangePassword?: boolean;
    course?: string | null;
}

export interface Employee {
    _id: string;
    crmCompanyId: string;
    companyName: string;
    fullName: string;
    position?: string;
    email: string;
    sector?: string;
    status: "Activo" | "Inactivo";
    courseAccount: CourseAccount;
    temporaryPassword?: string;
}

export interface QuizQuestion {
    question: string;
    options: string[];
    correctIndex?: number;
}

export interface S3File {
    s3Key?: string;
    s3Bucket?: string;
    originalName?: string;
}

export interface CourseVideo extends S3File {
    externalUrl?: string;
}

export interface CourseModule {
    _id: string;
    title: string;
    order: number;
    description?: string;
    pdf?: S3File;
    video?: CourseVideo;
    quiz?: QuizQuestion[];
    passingScore?: number;
}

export interface Course {
    _id: string;
    crmCompanyId: string | null;
    title: string;
    description?: string;
    active: boolean;
    modules: CourseModule[];
}

export interface CampaignTarget {
    _id: string;
    employee: { _id: string; fullName: string; email: string; position?: string; sector?: string } | string;
    sent: boolean;
    opened: boolean;
    clicked: boolean;
    submittedData: boolean;
    reported: boolean;
}

export interface CampaignMetrics {
    totalTargets: number;
    sent: number;
    opened: number;
    clicked: number;
    submittedData: number;
    reported: number;
    clickRate: number;
    reportRate: number;
}

export interface Campaign {
    _id: string;
    crmCompanyId: string;
    companyName: string;
    crmProjectId?: string | null;
    name: string;
    status: "Planeada" | "En curso" | "Completada";
    launchDate?: string | null;
    emailTemplate?: string;
    landingPage?: string;
    sendingProfile?: string;
    senderDomain?: string;
    campaignUrl?: string;
    gophishCampaignId?: string;
    notes?: string;
    targets: CampaignTarget[];
    metrics: CampaignMetrics;
    createdAt: string;
}
