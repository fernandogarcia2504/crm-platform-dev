import { useContext } from "react";
import { Navigate, Outlet } from "react-router-dom";

import { AuthContext } from "../context/AuthContext";

export default function ProtectedRoute() {
    const auth = useContext(AuthContext);

    if (!auth) return null;
    if (!auth.token) return <Navigate to="/" replace />;

    return <Outlet />;
}

export function TraineeProtectedRoute() {
    const token = localStorage.getItem("traineeToken");
    if (!token) return <Navigate to="/portal" replace />;
    return <Outlet />;
}
