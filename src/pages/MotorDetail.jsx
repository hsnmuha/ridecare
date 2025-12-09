import React, { useState, useEffect } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { fetchMotorById, fetchServices, fetchLatestOdometer } from '../services/api';
import { ArrowLeft, User, Calendar, Gauge, Wrench, Download, Timer, Droplet, Zap, Disc, CircleDot, AlertTriangle, CheckCircle, History, X, ChevronRight, Save } from 'lucide-react';
import { calculateStatus, getIntervals } from '../utils/logic';
import { addDays } from 'date-fns';
import clsx from 'clsx';

export const MotorDetail = () => {
    const { id } = useParams();
    const location = useLocation();

    // Data State
    const [motor, setMotor] = useState(location.state?.motor || null);
    const [services, setServices] = useState([]);
    const [latestOdometerRecord, setLatestOdometerRecord] = useState(null);
    const [loadingServices, setLoadingServices] = useState(true);

    // UI State
    const [selectedComponent, setSelectedComponent] = useState(null);
    const [customIntervals, setCustomIntervals] = useState(getIntervals());
    const [localInterval, setLocalInterval] = useState({ km: 0, months: 0 }); // Temporary state for editing
    const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'history'

    // Visibility Management State
    const [showManage, setShowManage] = useState(false);
    const [hiddenComponents, setHiddenComponents] = useState(() => {
        try {
            const stored = localStorage.getItem('ridecare_hidden_components');
            return stored ? JSON.parse(stored) : [];
        } catch { return []; }
    });

    useEffect(() => {
        const loadData = async () => {
            try {
                // If motor not passed via state, fetch it
                if (!motor) {
                    const motorData = await fetchMotorById(id);
                    if (motorData) {
                        setMotor(motorData);
                    } else {
                        // Handle case where motor is not found (deleted?)
                        console.error("Motor not found");
                    }
                }

                // Always fetch fresh services and odometer
                setLoadingServices(true);
                const [servicesData, odometerData] = await Promise.all([
                    fetchServices(id),
                    fetchLatestOdometer(id)
                ]);
                setServices(servicesData || []);
                setLatestOdometerRecord(odometerData);
            } catch (error) {
                console.error("Failed to load motor data", error);
            } finally {
                setLoadingServices(false);
            }
        };
        if (id) loadData();
    }, [id]);

    // Safety fallback
    if (!motor && !loadingServices) return <div className="p-8 text-center text-slate-500">Motor tidak ditemukan.</div>;

    const latestOdo = latestOdometerRecord?.nilai_odometer
        || motor?.odometer_awal
        || 0;

    // Re-calculate when services, odo, or intervals change
    const statusInfo = !loadingServices
        ? calculateStatus(services || [], latestOdo, new Date(), customIntervals)
        : { status: 'safe', message: 'Memuat status...', details: [] };

    const handleCardClick = (detail) => {
        setSelectedComponent(detail);
        setLocalInterval({ km: detail.interval.km, months: detail.interval.months });
        setActiveTab('overview');
    };

    const handleSaveInterval = () => {
        if (!selectedComponent) return;

        const newIntervals = {
            ...customIntervals,
            [selectedComponent.type]: {
                km: parseInt(localInterval.km),
                months: parseInt(localInterval.months)
            }
        };

        // Save to persist
        localStorage.setItem('ridecare_intervals', JSON.stringify(newIntervals));
        setCustomIntervals(newIntervals);

        // Close modal or show success? For now just stay to show updated calculation
        setSelectedComponent(null); // Close to feel like "done"
    };

    const toggleVisibility = (type) => {
        const isHidden = hiddenComponents.includes(type);
        const newHidden = isHidden
            ? hiddenComponents.filter(t => t !== type)
            : [...hiddenComponents, type];

        setHiddenComponents(newHidden);
        localStorage.setItem('ridecare_hidden_components', JSON.stringify(newHidden));
    };

    if (!motor) return <div className="p-4">Memuat Data Motor...</div>;

    // Helper for visual mapping
    const getComponentConfig = (type) => {
        const config = {
            'OliMesin': { icon: <Droplet size={32} />, label: 'Oli Mesin', color: 'text-amber-500', bg: 'bg-amber-100' },
            'KampasRem': { icon: <Disc size={32} />, label: 'Kampas Rem', color: 'text-red-500', bg: 'bg-red-100' },
            'Busi': { icon: <Zap size={32} />, label: 'Busi', color: 'text-purple-500', bg: 'bg-purple-100' },
            'Aki': { icon: <Zap size={32} />, label: 'Aki', color: 'text-yellow-500', bg: 'bg-yellow-100' },
            'Ban': { icon: <CircleDot size={32} />, label: 'Ban', color: 'text-slate-700', bg: 'bg-slate-200' },
            'FilterUdara': { icon: <History size={32} />, label: 'Filter Udara', color: 'text-sky-500', bg: 'bg-sky-100' },
            'GearSet': { icon: <Wrench size={32} />, label: 'Gear Set', color: 'text-zinc-600', bg: 'bg-zinc-200' },
            'Rantai': { icon: <Wrench size={32} />, label: 'Rantai', color: 'text-orange-500', bg: 'bg-orange-100' },
            'MinyakRem': { icon: <Droplet size={32} />, label: 'Minyak Rem', color: 'text-red-300', bg: 'bg-red-50' },
            'ServisRutin': { icon: <Wrench size={32} />, label: 'Servis Rutin', color: 'text-blue-500', bg: 'bg-blue-100' },
            // Fallback
        };
        return config[type] || { icon: <Wrench size={32} />, label: type?.replace(/([A-Z])/g, ' $1').trim(), color: 'text-slate-500', bg: 'bg-slate-100' };
    };

    return (
        <div className="pb-20 bg-slate-50 min-h-screen relative">
            {/* New Clean Header style inspired by design */}
            <div className="bg-white p-6 pb-4 pt-8 sticky top-0 z-20 shadow-sm border-b border-slate-100">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <Link to="/" className="p-2 -ml-2 text-slate-600 rounded-full hover:bg-slate-100 transition-colors">
                            <ArrowLeft size={24} />
                        </Link>
                        <div>
                            <h1 className="text-xl font-bold text-slate-800">{motor.nama_motor}</h1>
                            <p className="text-xs text-slate-400 font-medium tracking-wide">{motor.model} ({motor.tahun})</p>
                        </div>
                    </div>
                    <Link to="/settings" className="p-2 text-slate-400 hover:text-slate-600">
                        <Wrench size={20} />
                    </Link>
                </div>

                {/* Odometer Pill */}
                <div className="flex items-center justify-between bg-slate-100 rounded-2xl p-4">
                    <div className="flex items-center gap-3">
                        <div className="bg-white p-2 rounded-full shadow-sm text-slate-700">
                            <Gauge size={20} />
                        </div>
                        <span className="text-2xl font-mono font-bold text-slate-800 tracking-tight">
                            {latestOdo.toLocaleString()} <span className="text-sm text-slate-400 font-sans font-medium">km</span>
                        </span>
                    </div>
                    <Link to={`/add-odometer?motorId=${motor.id}`} className="bg-slate-900 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-md hover:bg-slate-800 active:scale-95 transition-all">
                        Update
                    </Link>
                </div>
            </div>

            <div className="px-4 mt-6">
                {/* Priority Banner */}
                {statusInfo.status !== 'safe' && (
                    <div className={clsx("rounded-2xl p-4 mb-6 shadow-sm border",
                        statusInfo.status === 'danger' ? "bg-red-50 border-red-100" : "bg-orange-50 border-orange-100"
                    )}>
                        <div className="flex items-start gap-3">
                            <AlertTriangle className={statusInfo.status === 'danger' ? "text-red-500" : "text-orange-500"} />
                            <div>
                                <h3 className={clsx("font-bold text-sm uppercase tracking-wide mb-1",
                                    statusInfo.status === 'danger' ? "text-red-700" : "text-orange-700"
                                )}>Perhatian Diperlukan</h3>
                                <p className="text-sm text-slate-600 leading-relaxed">
                                    {statusInfo.message}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                <div className="flex justify-between items-end mb-4">
                    <h3 className="font-bold text-slate-800 text-lg">Komponen</h3>
                    <button
                        onClick={() => setShowManage(true)}
                        className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg hover:bg-slate-200 transition-colors"
                    >
                        Atur
                    </button>
                </div>

                {/* GRID LAYOUT */}
                <div className="grid grid-cols-2 gap-4 mb-8">
                    {loadingServices ? (
                        /* Skeleton Loading */
                        Array(6).fill(0).map((_, i) => (
                            <div key={i} className="bg-slate-50 p-4 rounded-3xl border border-slate-100 min-h-[160px] animate-pulse relative overflow-hidden">
                                <div className="absolute top-4 left-4 w-10 h-10 bg-slate-200 rounded-full"></div>
                                <div className="absolute top-4 right-4 w-12 h-6 bg-slate-200 rounded-full"></div>
                                <div className="absolute bottom-16 left-0 right-0 flex justify-center">
                                    <div className="w-1/2 h-4 bg-slate-200 rounded"></div>
                                </div>
                                <div className="absolute bottom-6 left-0 right-0 flex flex-col items-center gap-2">
                                    <div className="w-3/4 h-6 bg-slate-200 rounded"></div>
                                    <div className="w-1/2 h-3 bg-slate-200 rounded"></div>
                                </div>
                            </div>
                        ))
                    ) : (
                        Array.isArray(statusInfo.details) && statusInfo.details
                            .filter(detail => {
                                // SHOW IF: (Not hidden) OR (Status is warning or danger)
                                return !hiddenComponents.includes(detail.type) || detail.status !== 'safe';
                            })
                            .map((detail) => {
                                const style = getComponentConfig(detail.type);
                                let estDate;
                                try {
                                    estDate = addDays(new Date(), detail.daysRemaining || 0);
                                    if (isNaN(estDate.getTime())) throw new Error("Invalid EST Date");
                                } catch (e) {
                                    estDate = new Date();
                                }

                                return (
                                    <div
                                        key={detail.type}
                                        onClick={() => handleCardClick(detail)}
                                        className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-between relative overflow-hidden group min-h-[160px] cursor-pointer hover:border-blue-200 transition-colors active:scale-95"
                                    >
                                        <div className="flex justify-between items-start mb-4 relative z-10">
                                            <div className={clsx("p-2 rounded-full bg-slate-50/50 backdrop-blur-sm", style.color)}>
                                                {/* Icon bg */}
                                            </div>
                                            <div className={clsx("text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1 uppercase tracking-wider",
                                                detail.status === 'safe' && "bg-green-50 text-green-600",
                                                detail.status === 'warning' && "bg-yellow-50 text-yellow-600",
                                                detail.status === 'danger' && "bg-red-50 text-red-600",
                                            )}>
                                                {detail.status === 'safe' ? 'Aman' : detail.status === 'warning' ? 'Cek' : 'Segera'}
                                            </div>
                                        </div>

                                        <div className="flex flex-col items-center text-center my-1 relative z-10">
                                            <div className={clsx("mb-2 p-3 rounded-full bg-white shadow-sm ring-4 ring-slate-50", style.color)}>
                                                {style.icon}
                                            </div>
                                            <h4 className="font-bold text-slate-700 text-sm mb-1">{style.label}</h4>

                                            <div className="mt-2 text-center relative z-10">
                                                <p className={clsx("font-bold text-sm",
                                                    detail.kmRemaining < 1000 ? "text-red-500" : "text-slate-800"
                                                )}>
                                                    {Math.max(0, detail.kmRemaining).toLocaleString()} <span className="text-[10px] font-normal text-slate-400">sisa km</span>
                                                </p>
                                                <p className="text-[10px] text-slate-400 mt-1">
                                                    {estDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: '2-digit' })}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Background decoration */}
                                        <div className={clsx("absolute -bottom-6 -right-6 opacity-[0.03] scale-150 rotate-12", style.color)}>
                                            {React.cloneElement(style.icon, { size: 100 })}
                                        </div>
                                    </div>
                                );
                            })
                    )}
                </div>
            </div>

            {/* MANAGE VISIBILITY MODAL */}
            {showManage && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowManage(false)}></div>
                    <div className="bg-white w-full max-w-md h-[80vh] sm:h-auto sm:rounded-3xl rounded-t-3xl shadow-2xl relative flex flex-col transition-transform">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-slate-800">Atur Tampilan</h2>
                            <button onClick={() => setShowManage(false)} className="p-2 bg-slate-100 rounded-full text-slate-500">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1">
                            <p className="text-sm text-slate-500 mb-4 bg-blue-50 p-3 rounded-xl border border-blue-100">
                                Hilangkan centang untuk menyembunyikan komponen dari halaman depan. Komponen yang butuh servis (Cek/Segera) akan <b>selalu muncul otomatis</b>.
                            </p>
                            <div className="space-y-2">
                                {Object.keys(customIntervals).map(type => {
                                    const config = getComponentConfig(type);
                                    const isHidden = hiddenComponents.includes(type);
                                    return (
                                        <div key={type}
                                            onClick={() => toggleVisibility(type)}
                                            className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:bg-slate-50 cursor-pointer active:scale-95 transition-transform"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={clsx("p-2 rounded-full", config.bg, config.color)}>
                                                    {React.cloneElement(config.icon, { size: 18 })}
                                                </div>
                                                <span className="font-bold text-slate-700 text-sm">{config.label}</span>
                                            </div>
                                            <div className={clsx("w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors",
                                                !isHidden ? "bg-primary border-primary" : "border-slate-300"
                                            )}>
                                                {!isHidden && <CheckCircle size={14} className="text-white" />}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* DETAIL MODAL OVERLAY */}
            {selectedComponent && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center pointer-events-none">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm pointer-events-auto" onClick={() => setSelectedComponent(null)}></div>
                    <div className="bg-slate-50 w-full max-w-md h-[85vh] sm:h-auto sm:rounded-3xl rounded-t-3xl shadow-2xl relative pointer-events-auto flex flex-col transition-transform transform translate-y-0">

                        {/* Modal Header */}
                        <div className="bg-white p-6 rounded-t-3xl border-b border-slate-100 flex justify-between items-start sticky top-0 z-10">
                            <div className="flex items-center gap-4">
                                <div className={clsx("p-3 rounded-full bg-slate-50", getComponentConfig(selectedComponent.type).color)}>
                                    {getComponentConfig(selectedComponent.type).icon}
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-slate-800">{getComponentConfig(selectedComponent.type).label}</h2>
                                    <p className="text-xs text-slate-400">
                                        Servis Terakhir: {selectedComponent.lastServiceDate ? new Date(selectedComponent.lastServiceDate).toLocaleDateString('id-ID', { dateStyle: 'long' }) : 'Belum pernah'}
                                    </p>
                                </div>
                            </div>
                            <button onClick={() => setSelectedComponent(null)} className="p-2 bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Tabs */}
                        <div className="flex p-2 bg-white border-b border-slate-100">
                            <button
                                onClick={() => setActiveTab('overview')}
                                className={clsx("flex-1 py-2 text-sm font-bold rounded-xl transition-all",
                                    activeTab === 'overview' ? "bg-slate-100 text-slate-800" : "text-slate-400 hover:bg-slate-50"
                                )}
                            >
                                Ringkasan & Atur
                            </button>
                            <button
                                onClick={() => setActiveTab('history')}
                                className={clsx("flex-1 py-2 text-sm font-bold rounded-xl transition-all",
                                    activeTab === 'history' ? "bg-slate-100 text-slate-800" : "text-slate-400 hover:bg-slate-50"
                                )}
                            >
                                Riwayat Servis
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="p-6 overflow-y-auto flex-1">
                            {activeTab === 'overview' ? (
                                <div className="space-y-6">
                                    {/* Status Section */}
                                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Status Saat Ini</h3>

                                        <div className="space-y-4">
                                            <div>
                                                <div className="flex justify-between text-sm mb-1">
                                                    <span className="font-medium text-slate-600">Kilometer</span>
                                                    <span className="font-bold text-slate-800">
                                                        {(selectedComponent.interval.km - selectedComponent.kmRemaining).toLocaleString()} / {selectedComponent.interval.km.toLocaleString()} km
                                                    </span>
                                                </div>
                                                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                                    <div className={clsx("h-full rounded-full",
                                                        selectedComponent.percentKm >= 100 ? "bg-red-500" : selectedComponent.percentKm >= 80 ? "bg-amber-500" : "bg-green-500"
                                                    )} style={{ width: `${Math.min(100, selectedComponent.percentKm)}%` }}></div>
                                                </div>
                                            </div>

                                            <div>
                                                <div className="flex justify-between text-sm mb-1">
                                                    <span className="font-medium text-slate-600">Waktu (Bulan)</span>
                                                    <span className="font-bold text-slate-800">
                                                        {Math.floor(selectedComponent.percentTime / 100 * selectedComponent.interval.months)} / {selectedComponent.interval.months} Bulan
                                                    </span>
                                                </div>
                                                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                                    <div className={clsx("h-full rounded-full",
                                                        selectedComponent.percentTime >= 100 ? "bg-red-500" : selectedComponent.percentTime >= 80 ? "bg-amber-500" : "bg-green-500"
                                                    )} style={{ width: `${Math.min(100, selectedComponent.percentTime)}%` }}></div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Edit Logic */}
                                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Atur Interval</h3>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-bold text-slate-600 mb-1">Interval KM</label>
                                                <input
                                                    type="number"
                                                    value={localInterval.km}
                                                    onChange={(e) => setLocalInterval({ ...localInterval, km: e.target.value })}
                                                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-mono font-bold"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-600 mb-1">Interval Bulan</label>
                                                <input
                                                    type="number"
                                                    value={localInterval.months}
                                                    onChange={(e) => setLocalInterval({ ...localInterval, months: e.target.value })}
                                                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-mono font-bold"
                                                />
                                            </div>
                                        </div>
                                        <p className="text-[10px] text-slate-400 mt-2 italic">
                                            Ubah angka di atas untuk menyesuaikan jadwal servis khusus komponen ini.
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {/* Filtered History */}
                                    {services?.filter(s => s.jenis_perawatan === selectedComponent.type).map(service => (
                                        <div key={service.id} className="bg-white p-4 rounded-xl border border-slate-100 flex justify-between items-center">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-sm font-bold text-slate-700">{new Date(service.tanggal_perawatan).toLocaleDateString('id-ID', { dateStyle: 'medium' })}</span>
                                                    {service.nama_bengkel && <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-500">{service.nama_bengkel}</span>}
                                                </div>
                                                <p className="text-xs text-slate-400 font-mono">
                                                    @{service.odometer_saat_ganti.toLocaleString()} km
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-bold text-primary">Rp {service.biaya.toLocaleString()}</p>
                                            </div>
                                        </div>
                                    ))}
                                    {services?.filter(s => s.jenis_perawatan === selectedComponent.type).length === 0 && (
                                        <div className="text-center py-8 text-slate-400 italic">
                                            Belum ada riwayat untuk {getComponentConfig(selectedComponent.type).label}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Footer Action */}
                        <div className="p-4 bg-white border-t border-slate-100">
                            {activeTab === 'overview' ? (
                                <button onClick={handleSaveInterval} className="w-full bg-slate-900 text-white font-bold py-3 rounded-xl shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2">
                                    <Save size={18} /> Simpan Pengaturan
                                </button>
                            ) : (
                                <Link to="/add-service" className="block w-full bg-primary text-white font-bold py-3 rounded-xl shadow-lg text-center active:scale-95 transition-all">
                                    + Catat Servis Baru
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MotorDetail;
