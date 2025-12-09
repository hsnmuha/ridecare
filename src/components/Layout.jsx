import React from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { Home, PlusCircle, Settings, Gauge, PieChart } from 'lucide-react';
import clsx from 'clsx';

export const Layout = () => {
    const location = useLocation();
    const isDetailPage = location.pathname.startsWith('/motor/');

    return (
        <div className="min-h-screen flex flex-col bg-slate-50">
            {!isDetailPage && (
                <header className="bg-primary text-white p-4 shadow-md sticky top-0 z-10">
                    <h1 className="text-xl font-bold tracking-tight">RideCare</h1>
                </header>
            )}

            <main className={clsx("flex-1 overflow-y-auto pb-20", !isDetailPage && "p-4")}>
                <Outlet />
            </main>

            <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] grid grid-cols-4 gap-1 p-2 z-20 pb-safe">
                <NavLink
                    to="/"
                    className={({ isActive }) => clsx("flex flex-col items-center justify-center p-2 rounded-lg transition-colors", isActive ? "text-primary" : "text-slate-400 hover:text-slate-600")}
                >
                    <Home size={24} />
                    <span className="text-[10px] font-medium mt-1">Beranda</span>
                </NavLink>

                <NavLink
                    to="/add-service"
                    className={({ isActive }) => clsx("flex flex-col items-center justify-center p-2 rounded-lg transition-colors", isActive ? "text-primary" : "text-slate-400 hover:text-slate-600")}
                >
                    <PlusCircle size={24} />
                    <span className="text-[10px] font-medium mt-1">Servis</span>
                </NavLink>

                <NavLink
                    to="/add-odometer"
                    className={({ isActive }) => clsx("flex flex-col items-center justify-center p-2 rounded-lg transition-colors", isActive ? "text-primary" : "text-slate-400 hover:text-slate-600")}
                >
                    <Gauge size={24} />
                    <span className="text-[10px] font-medium mt-1">Catat KM</span>
                </NavLink>

                <NavLink
                    to="/statistics"
                    className={({ isActive }) => clsx("flex flex-col items-center justify-center p-2 rounded-lg transition-colors", isActive ? "text-primary" : "text-slate-400 hover:text-slate-600")}
                >
                    <PieChart size={24} />
                    <span className="text-[10px] font-medium mt-1">Statistik</span>
                </NavLink>
            </nav>
        </div >
    );
};
