import { Routes, Route, BrowserRouter } from "react-router-dom";

import { AuthProvider } from "../context/AuthContext";
import { ClientProvider } from "../context/ClientContext";

import ProtectedRoute, { TraineeProtectedRoute } from "./ProtectedRoute";
import AppLayout from "../layouts/AppLayout";

import LoginPage from "../../features/auth/LoginPage";

import PanelPage from "../../features/panel/PanelPage";
import ClientsPage from "../../features/clients/ClientsPage";

import ExposurePage from "../../features/exposure/ExposurePage";
import ExposurePipelinePage from "../../features/exposure/ExposurePipelinePage";
import ExposureFindingsPage from "../../features/exposure/ExposureFindingsPage";
import ExposurePosturePage from "../../features/exposure/ExposurePosturePage";

import EmployeesPage from "../../features/awareness/EmployeesPage";
import CoursePage from "../../features/awareness/CoursePage";
import CampaignsPage from "../../features/awareness/CampaignsPage";
import CampaignDetailPage from "../../features/awareness/CampaignDetailPage";
import ReportsPage from "../../features/awareness/ReportsPage";

import ComingSoonPage from "../../features/placeholder/ComingSoonPage";

import TraineeLoginPage from "../../features/trainee/TraineeLoginPage";
import TraineeCoursePage from "../../features/trainee/TraineeCoursePage";

export default function AppRouter() {
    return (
        <AuthProvider>
            <ClientProvider>
                <BrowserRouter>
                    <Routes>
                        <Route path="/" element={<LoginPage />} />

                        {/* Portal de trainees (colaboradores del cliente) */}
                        <Route path="/portal" element={<TraineeLoginPage />} />
                        <Route element={<TraineeProtectedRoute />}>
                            <Route path="/portal/curso" element={<TraineeCoursePage />} />
                        </Route>

                        {/* Consola de operación (staff) */}
                        <Route element={<ProtectedRoute />}>
                            <Route element={<AppLayout />}>
                                <Route path="/panel" element={<PanelPage />} />
                                <Route path="/clientes" element={<ClientsPage />} />

                                <Route path="/exposicion" element={<ExposurePage />} />
                                <Route path="/exposicion/pipeline" element={<ExposurePipelinePage />} />
                                <Route path="/exposicion/hallazgos" element={<ExposureFindingsPage />} />
                                <Route path="/exposicion/postura" element={<ExposurePosturePage />} />

                                <Route path="/concientizacion/empleados" element={<EmployeesPage />} />
                                <Route path="/concientizacion/curso" element={<CoursePage />} />
                                <Route path="/concientizacion/campanas" element={<CampaignsPage />} />
                                <Route path="/concientizacion/campanas/:campaignId" element={<CampaignDetailPage />} />
                                <Route path="/concientizacion/reportes" element={<ReportsPage />} />

                                <Route path="/investigacion" element={<ComingSoonPage line="Investigación y Debida Diligencia" />} />
                                <Route path="/riesgos" element={<ComingSoonPage line="Evaluación de Riesgos" />} />
                            </Route>
                        </Route>
                    </Routes>
                </BrowserRouter>
            </ClientProvider>
        </AuthProvider>
    );
}
