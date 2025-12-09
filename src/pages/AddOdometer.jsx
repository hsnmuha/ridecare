import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { fetchMotors, fetchOdometers, addOdometer } from '../services/api';
import { ArrowLeft, Save, Gauge } from 'lucide-react';

export const AddOdometer = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const preSelectedId = searchParams.get('motorId');

    const [motors, setMotors] = useState([]);
    const [loading, setLoading] = useState(true);

    const [selectedMotorId, setSelectedMotorId] = useState(preSelectedId || '');
    const [formData, setFormData] = useState({
        tanggal_catat: new Date().toISOString().split('T')[0],
        nilai_odometer: '',
    });

    const [lastOdoValue, setLastOdoValue] = useState(0);

    // Load Motors
    useEffect(() => {
        const loadMotors = async () => {
            try {
                const data = await fetchMotors();
                setMotors(data);
                if (data && data.length > 0 && !selectedMotorId && !preSelectedId) {
                    setSelectedMotorId(data[0].id);
                }
            } catch (e) { console.error(e); } finally { setLoading(false); }
        };
        loadMotors();
    }, [preSelectedId]);

    // When motor selected, fetch last odometer
    useEffect(() => {
        const loadLastOdo = async () => {
            if (!selectedMotorId) return;
            try {
                // We could optimize this by dedicated "getLastOdometer" api, simplified here
                const odos = await fetchOdometers(selectedMotorId);
                // odos is sorted desc by date
                if (odos && odos.length > 0) {
                    setLastOdoValue(odos[0].nilai_odometer);
                } else {
                    // Try to find motor initial odo
                    const m = motors.find(m => m.id === selectedMotorId);
                    if (m) setLastOdoValue(m.odometer_awal);
                }
            } catch (e) { console.error(e); }
        };
        loadLastOdo();
    }, [selectedMotorId, motors]);

    // Calculate difference
    const currentInput = parseInt(formData.nilai_odometer) || 0;
    const distanceDiff = currentInput > lastOdoValue ? currentInput - lastOdoValue : 0;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedMotorId) return alert("Pilih motor");
        if (currentInput <= lastOdoValue && lastOdoValue > 0) return alert("Odometer baru harus lebih besar dari sebelumnya (" + lastOdoValue + " km)");

        try {
            await addOdometer({
                motor_id: selectedMotorId,
                tanggal_catat: new Date(formData.tanggal_catat),
                nilai_odometer: currentInput
            });
            navigate('/');
        } catch (e) {
            console.error(e);
            alert("Gagal menyimpan");
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div>
            <div className="flex items-center gap-2 mb-6">
                <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-slate-600 rounded-full hover:bg-slate-100">
                    <ArrowLeft size={24} />
                </button>
                <div className="flex-1">
                    <h2 className="text-xl font-bold text-slate-800">Catat Odometer</h2>
                    <p className="text-xs text-slate-500">Update jarak tempuh berkala</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Pilih Motor</label>
                    <select
                        className="w-full rounded-xl border-slate-200 shadow-sm focus:border-primary focus:ring-primary p-4 bg-white border font-medium"
                        value={selectedMotorId}
                        onChange={(e) => setSelectedMotorId(e.target.value)}
                    >
                        {motors.length === 0 && <option value="">Belum ada motor</option>}
                        {motors.map(m => (
                            <option key={m.id} value={m.id}>{m.nama_motor} ({m.no_polisi})</option>
                        ))}
                    </select>
                </div>

                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex justify-between items-center">
                    <div>
                        <p className="text-xs text-blue-600 font-bold uppercase tracking-wider">Terakhir Tercatat</p>
                        <p className="text-lg font-mono font-bold text-blue-900">{lastOdoValue.toLocaleString()} km</p>
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-blue-600 font-bold uppercase tracking-wider">Selisih Harian/Trip</p>
                        <p className="text-lg font-mono font-bold text-green-600">+{distanceDiff.toLocaleString()} km</p>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Tanggal Pencatatan</label>
                    <input
                        type="date"
                        className="w-full rounded-xl border-slate-200 shadow-sm focus:border-primary focus:ring-primary p-4 bg-white border"
                        value={formData.tanggal_catat}
                        onChange={e => setFormData({ ...formData, tanggal_catat: e.target.value })}
                    />
                </div>

                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Odometer Terkini (km)</label>
                    <div className="relative">
                        <Gauge className="absolute left-4 top-[18px] text-slate-400" size={24} />
                        <input
                            type="number"
                            required
                            placeholder="0"
                            className="w-full rounded-xl border-slate-200 shadow-sm focus:border-primary focus:ring-primary p-4 pl-12 bg-white border text-2xl font-mono font-bold text-slate-800"
                            value={formData.nilai_odometer}
                            onChange={e => setFormData({ ...formData, nilai_odometer: e.target.value })}
                        />
                    </div>
                    <p className="text-xs text-slate-400 mt-2 px-1">
                        Masukkan angka total yang tertera di speedometer motor.
                    </p>
                </div>

                <button
                    type="submit"
                    disabled={distanceDiff <= 0 && lastOdoValue > 0}
                    className="w-full bg-primary text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-500/30 active:scale-95 transition-transform flex justify-center items-center gap-2 mt-8 disabled:opacity-50 disabled:shadow-none"
                >
                    <Save size={20} />
                    Simpan Update
                </button>
            </form>
        </div>
    );
};

export default AddOdometer;
