import React, { useState } from 'react';
import { fetchMotors, fetchServices, fetchOdometers } from '../services/api';
import { Download, Upload, Trash2, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Settings = () => {
    const navigate = useNavigate();
    const [importing, setImporting] = useState(false);

    const handleExport = async () => {
        try {
            // Fetch all data from Supabase
            // Note: This fetches ALL data. In production with RLS restricted to user this is fine.
            // With public access, this fetches everything.
            const motors = await fetchMotors();

            // For services/odos, we might need to fetch per motor or fetch all if API supports it.
            // Our API fetchServices requires motorId. 
            // We should ideally have fetchAllServices() or similar if we want full backup.
            // For now, let's iterate (inefficient but works for small data)
            let services = [];
            let odometers = [];

            for (const m of motors) {
                const s = await fetchServices(m.id);
                const o = await fetchOdometers(m.id);
                services = [...services, ...s];
                odometers = [...odometers, ...o];
            }

            const data = { motors, services, odometers, timestamp: new Date().toISOString() };
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = url;
            a.download = `ridecare_backup_${new Date().toISOString().split('T')[0]}.json`;
            a.click();
        } catch (e) {
            console.error(e);
            alert("Gagal melakukan backup.");
        }
    };

    const handleImport = async (e) => {
        alert("Fitur restore dinonaktifkan dalam mode Online (Supabase).");
    };

    const handleReset = async () => {
        if (confirm("Reset pengaturan tampilan dan interval servis? Data motor TIDAK akan dihapus.")) {
            localStorage.clear();
            window.location.reload();
        }
    }

    return (
        <div>
            <div className="flex items-center gap-2 mb-6">
                <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-slate-600 rounded-full hover:bg-slate-100">
                    <ArrowLeft size={24} />
                </button>
                <h2 className="text-xl font-bold text-slate-800">Pengaturan</h2>
            </div>

            <div className="space-y-4">
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                    <h3 className="font-bold text-slate-700 mb-2">Backup Data</h3>
                    <p className="text-sm text-slate-500 mb-4">Download data dari Cloud ke file JSON.</p>

                    <div className="flex gap-4">
                        <button onClick={handleExport} className="flex-1 bg-blue-50 text-blue-600 font-medium py-3 px-4 rounded-lg flex flex-col items-center gap-2 hover:bg-blue-100 transition-colors">
                            <Download size={24} />
                            <span>Download Backup</span>
                        </button>

                        {/* Import Disabled for now */}
                        <div className="flex-1 bg-slate-50 text-slate-400 font-medium py-3 px-4 rounded-lg flex flex-col items-center gap-2 cursor-not-allowed">
                            <Upload size={24} />
                            <span>Restore (Off)</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-xl shadow-sm border border-red-100">
                    <h3 className="font-bold text-red-700 mb-2">Reset Pengaturan</h3>
                    <p className="text-sm text-slate-500 mb-4">Kembalikan pengaturan interval dan tampilan ke default.</p>

                    <button onClick={handleReset} className="w-full bg-red-50 text-red-600 font-medium py-3 px-4 rounded-lg flex items-center justify-center gap-2 hover:bg-red-100 transition-colors">
                        <Trash2 size={20} />
                        <span>Reset Pengaturan Lokal</span>
                    </button>
                </div>
            </div>

            <div className="mt-12 text-center">
                <p className="text-xs text-slate-400">RideCare v1.1.0 (Online Mode)</p>
            </div>
        </div>
    );
};

export default Settings;
