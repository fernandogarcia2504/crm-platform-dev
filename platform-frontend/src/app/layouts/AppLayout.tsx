import { Outlet } from "react-router-dom";

import Sidebar from "../../components/layout/Sidebar";

export default function AppLayout() {
    return (
        <div className="flex min-h-screen w-full bg-canvas text-ink">
            <Sidebar />
            <main className="flex-1 overflow-x-hidden">
                <div className="mx-auto w-full max-w-[1180px] px-6 pb-16 md:px-10">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
