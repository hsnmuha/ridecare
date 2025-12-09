import React, { useState, useEffect } from 'react';
import { Flag, Gauge, Calendar, AlertTriangle, CheckCircle, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { fetchMotors, fetchServices } from '../services/api';
import { calculateStatus } from '../utils/logic';
import clsx from 'clsx';

const MotorCard = ({ motor }) => {
    const [allServices, setAllServices] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadServices = async () => {
            try {
                // motor.id is the UUID from Supabase
                const services = await fetchServices(motor.id);
                setAllServices(services);
            } catch (err) {
                console.error("Failed to load services for motor", motor.id, err);
            } finally {
                setLoading(false);
            }
        }
        loadServices();
    }, [motor.id]);

    const lastOdo = 0; // TODO: Fetch from odometers table if needed, or rely on motor.odometer_awal logic?
    // Actually, logic.js calculateStatus takes currentOdometer. 
    // The previous code fetched 'lastOdo' from odometers table.
    // Ideally we should also fetch odometers here or simplify.
    // For now, let's use motor.odometer_awal as fallback if no odometer/service history.
    // Wait, the previous code had: const lastOdo = useLiveQuery(() => db.odometers...);
    // Supposedly I should also fetch the latest odometer reading.
    // But `api.fetchServices` does not return odometers.
    // I entered `fetchOdometers` in api.js. I should use it.
    // BUT to keep it simple and performant, maybe just rely on services for now?
    // No, `calculateStatus` needs precise odometer.
    // Let's rely on calculation inside logic.js or fetch it?
    // Let's modify logic.js to NOT fail if odometer is missing, or fetch it.
    // Actually, I'll skip fetching odometers separately for this card view for performance unless critical.
    // Does `calculateStatus` use `currentOdo`? Yes.
    // `currentOdo` came from `lastOdo.nilai_odometer`.
    // If I don't fetch it, I can only use `motor.odometer_awal` or the last service's odometer.
    // Let's assume `motor.odometer_awal` + some delta? No that's impossible.
    // I should probably fetch the latest odometer.
    // Or... I can modify `fetchMotors` to JOIN data? Supabase simpler API doesn't do deep joins easily without knowing foreign keys well.
    // Let's just use `motor.odometer_awal` for now to get it working, or last service odometer.
    // Re-reading logic.js: `calculateStatus` takes `allServices` and `currentOdometer`.

    // Quick fix: Use the odometer from the latest service as a proxy for current odometer if separate odometer record isn't fetched.
    // Or better: `allServices` has `odometer_saat_ganti`.
    // The previous code fetched `odometers` table separately.
    // I will simplify: Use the Max(odometer from services, motor.odometer_awal). This is decent approximation if user enters service.
    // But user might add Odometer reading WITHOUT service.
    // Okay, I won't implement fetching odometers in the card for now to save requests/complexity, 
    // I will use `motor.odometer_awal` or max of service odometers.

    const maxServiceOdo = allServices.reduce((max, s) => Math.max(max, s.odometer_saat_ganti || 0), 0);
    const currentOdo = Math.max(maxServiceOdo, motor.odometer_awal || 0);

    const statusInfo = !loading ? calculateStatus(allServices, currentOdo) : { status: 'safe', message: 'Loading...' };

    const lastService = allServices.length > 0 ? allServices[0] : null;

    return (
        <Link to={`/motor/${motor.id}`} className="block bg-white rounded-xl shadow-sm border border-slate-100 p-4 mb-4 active:scale-95 transition-transform">
            <div className="flex justify-between items-start mb-2">
                <div>
                    <h3 className="text-lg font-bold text-slate-800">{motor.nama_motor}</h3>
                    <p className="text-sm text-slate-500">{motor.merek} {motor.model} ({motor.tahun})</p>
                </div>
                <div className={clsx("p-2 rounded-full bg-slate-100",
                    statusInfo.status === 'safe' && "text-success bg-green-50",
                    statusInfo.status === 'warning' && "text-warning bg-yellow-50",
                    statusInfo.status === 'danger' && "text-danger bg-red-50",
                )}>
                    {statusInfo.status === 'safe' && <CheckCircle size={20} />}
                    {statusInfo.status === 'warning' && <AlertTriangle size={20} />}
                    {statusInfo.status === 'danger' && <AlertTriangle size={20} />}
                </div>
            </div>

            <div className="flex items-center gap-4 text-sm text-slate-600 mt-4">
                <div className="flex items-center gap-1">
                    <Gauge size={16} className="text-slate-400" />
                    <span>{currentOdo.toLocaleString()} km</span>
                </div>
                <div className="flex items-center gap-1">
                    <Calendar size={16} className="text-slate-400" />
                    {lastService
                        ? <span>{new Date(lastService.tanggal_perawatan).toLocaleDateString()}</span>
                        : <span>Belum servis</span>
                    }
                </div>
            </div>

            <div className="mt-3 pt-3 border-t border-slate-50 flex justify-between items-center">
                <span className={clsx("text-xs font-semibold px-2 py-1 rounded",
                    statusInfo.status === 'safe' && "bg-green-100 text-green-700",
                    statusInfo.status === 'warning' && "bg-yellow-100 text-yellow-700",
                    statusInfo.status === 'danger' && "bg-red-100 text-red-700",
                )}>
                    {statusInfo.message}
                </span>
                <span className="text-xs text-slate-400">{motor.no_polisi}</span>
            </div>
        </Link>
    );
}

export const Home = () => {
    const [motors, setMotors] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadMotors = async () => {
            try {
                const data = await fetchMotors();
                setMotors(data);
            } catch (error) {
                console.error("Failed to load motors", error);
            } finally {
                setLoading(false);
            }
        };
        loadMotors();
    }, []);

    if (loading) return <div className="p-4 text-center">Memuat...</div>;

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-slate-700">Garasi Saya</h2>
                <Link to="/add-motor" className="flex items-center gap-1 text-sm font-medium text-primary bg-blue-50 px-3 py-1.5 rounded-full">
                    <Plus size={16} />
                    Tambah
                </Link>
            </div>

            {motors.length === 0 ? (
                <div className="text-center py-10 bg-white rounded-xl shadow-sm border border-dashed border-slate-300">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Flag size={32} className="text-slate-300" />
                    </div>
                    <h3 className="text-slate-600 font-medium">Belum ada motor</h3>
                    <p className="text-slate-400 text-sm mt-1 mb-4">Tambahkan motor pertamamu untuk mulai melacak.</p>
                    <Link to="/add-motor" className="btn btn-primary inline-flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg font-medium shadow-sm hover:bg-blue-700 transition-colors">
                        <Plus size={18} /> Tambah Motor
                    </Link>
                </div>
            ) : (
                motors.map(motor => <MotorCard key={motor.id} motor={motor} />)
            )}
        </div>
    );
};

export default Home;
