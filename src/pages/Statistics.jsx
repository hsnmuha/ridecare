import React, { useState, useEffect } from 'react';
import { fetchMotors, fetchServices } from '../services/api';
import { Wallet, Wrench, PieChart } from 'lucide-react';

export const Statistics = () => {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalSpend: 0,
        motorSpends: [],
        categorySpends: {}
    });

    const [error, setError] = useState(null);

    useEffect(() => {
        const loadData = async () => {
            try {
                const motors = await fetchMotors();
                if (!motors) throw new Error("Gagal mengambil data motor");

                let total = 0;
                let motorSpends = [];
                let categorySpends = {};

                // Process sequentially to be safe, or Promise.all if independent
                for (const m of motors) {
                    const services = await fetchServices(m.id);
                    // Ensure services is array
                    const serviceList = services || [];
                    const motorTotal = serviceList.reduce((sum, s) => sum + (parseInt(s.biaya) || 0), 0);

                    total += motorTotal;
                    motorSpends.push({
                        ...m,
                        totalCost: motorTotal,
                        serviceCount: serviceList.length
                    });

                    // Category breakdown
                    serviceList.forEach(s => {
                        const cat = s.jenis_perawatan || 'Lainnya';
                        categorySpends[cat] = (categorySpends[cat] || 0) + (parseInt(s.biaya) || 0);
                    });
                }

                // Sort by highest spend
                motorSpends.sort((a, b) => b.totalCost - a.totalCost);

                setStats({
                    totalSpend: total,
                    motorSpends,
                    categorySpends
                });
            } catch (err) {
                console.error("Error loading stats", err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, []);

    if (loading) return <div className="p-8 text-center text-slate-500">Menghitung Statistik...</div>;
    if (error) return <div className="p-8 text-center text-red-500">Error: {error}</div>;

    // Helper to format currency
    const fmt = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);

    return (
        <div className="pb-24">
            <div className="bg-primary pt-8 pb-12 px-6 rounded-b-[3rem] shadow-lg mb-6">
                <div className="flex items-center gap-2 mb-2 opacity-80 text-blue-100">
                    <PieChart size={20} />
                    <span className="text-sm font-medium uppercase tracking-wider">Total Pengeluaran</span>
                </div>
                <h1 className="text-4xl font-bold text-white mb-2">{fmt(stats.totalSpend)}</h1>
                <p className="text-blue-200 text-sm">Akumulasi biaya servis semua kendaraan</p>
            </div>

            <div className="px-6 space-y-8">

                {/* Per Motor Breakdown */}
                <section>
                    <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <Wallet size={20} className="text-primary" />
                        Detail per Motor
                    </h2>
                    <div className="space-y-3">
                        {stats.motorSpends.length === 0 && <p className="text-slate-400 text-sm italic">Belum ada data motor.</p>}
                        {stats.motorSpends.map(m => (
                            <div key={m.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex justify-between items-center">
                                <div>
                                    <h3 className="font-bold text-slate-700">{m.nama_motor}</h3>
                                    <p className="text-xs text-slate-500">{m.serviceCount}x Servis</p>
                                </div>
                                <span className="font-mono font-bold text-slate-800">{fmt(m.totalCost)}</span>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Category Breakdown */}
                <section>
                    <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <Wrench size={20} className="text-primary" />
                        Kategori Pengeluaran
                    </h2>
                    <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 space-y-4">
                        {Object.entries(stats.categorySpends)
                            .sort(([, a], [, b]) => b - a)
                            .map(([cat, val]) => (
                                <div key={cat}>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="font-medium text-slate-600">{cat}</span>
                                        <span className="font-bold text-slate-800">{fmt(val)}</span>
                                    </div>
                                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-primary rounded-full"
                                            style={{ width: `${(val / (stats.totalSpend || 1)) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        {Object.keys(stats.categorySpends).length === 0 && (
                            <p className="text-center text-slate-400 text-sm py-4">Belum ada data pengeluaran.</p>
                        )}
                    </div>
                </section>

            </div>
        </div>
    );
};
