import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchMotors, addService, uploadReceipt, addOdometer } from '../services/api';
import { predictNextService, generateId } from '../utils/logic';
import { ArrowLeft, Save, Upload, Camera } from 'lucide-react';

export const AddService = () => {
    const navigate = useNavigate();
    const [motors, setMotors] = useState([]);
    const [loading, setLoading] = useState(false);
    const [dataLoading, setDataLoading] = useState(true);

    // Default to first motor if exists
    const [selectedMotorId, setSelectedMotorId] = useState('');

    useEffect(() => {
        const loadMotors = async () => {
            try {
                const data = await fetchMotors();
                setMotors(data);
                if (data && data.length > 0 && !selectedMotorId) {
                    setSelectedMotorId(data[0].id);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setDataLoading(false);
            }
        };
        loadMotors();
    }, []);

    const [formData, setFormData] = useState({
        jenis_perawatan: 'OliMesin',
        tanggal_perawatan: new Date().toISOString().split('T')[0],
        odometer_saat_ganti: '',
        biaya: '',
        nama_bengkel: '',
        detail_spesifik: '',
    });

    // For file
    const [receipt, setReceipt] = useState(null);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setReceipt(e.target.files[0]);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedMotorId) return alert("Pilih motor terlebih dahulu");

        setLoading(true);
        try {
            const motorId = selectedMotorId;
            const odometerVal = parseInt(formData.odometer_saat_ganti);

            // 0. Upload Receipt if exists
            let receiptUrl = null;
            if (receipt) {
                receiptUrl = await uploadReceipt(receipt);
            }

            // 1. Prepare Data
            const serviceData = {
                motor_id: motorId,
                jenis_perawatan: formData.jenis_perawatan,
                tanggal_perawatan: formData.tanggal_perawatan,
                odometer_saat_ganti: odometerVal,
                biaya: parseInt(formData.biaya) || 0,
                nama_bengkel: formData.nama_bengkel,
                detail_spesifik: formData.detail_spesifik,
                receipt_url: receiptUrl
            };

            // 2. Calculate Prediction
            const prediction = predictNextService(serviceData);
            serviceData.jadwal_berikutnya_km = prediction.nextKm;
            serviceData.jadwal_berikutnya_tanggal = prediction.nextDate;

            // 3. Save Service
            await addService(serviceData);

            // 4. Update/Add Odometer Record if this is the latest
            // We use addOdometer from api
            await addOdometer({
                motor_id: motorId,
                tanggal_catat: new Date(formData.tanggal_perawatan),
                nilai_odometer: odometerVal
            });

            navigate('/');

        } catch (error) {
            console.error("Failed to add service", error);
            alert("Gagal menyimpan data servis.");
        } finally {
            setLoading(false);
        }
    };

    if (dataLoading) return <div>Loading...</div>;

    return (
        <div>
            <div className="flex items-center gap-2 mb-6">
                <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-slate-600 rounded-full hover:bg-slate-100">
                    <ArrowLeft size={24} />
                </button>
                <h2 className="text-xl font-bold text-slate-800">Catat Servis</h2>
            </div>

            {motors.length === 0 ? (
                <div className="text-center p-4 text-slate-500">
                    Silakan tambah motor terlebih dahulu.
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-4 pb-10">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Pilih Motor</label>
                        <select
                            className="w-full rounded-lg border-slate-300 shadow-sm focus:border-primary focus:ring-primary p-3 bg-white border"
                            value={selectedMotorId}
                            onChange={(e) => setSelectedMotorId(e.target.value)}
                        >
                            {motors.map(m => (
                                <option key={m.id} value={m.id}>{m.nama_motor} ({m.no_polisi})</option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Jenis Servis</label>
                            <select
                                name="jenis_perawatan"
                                className="w-full rounded-lg border-slate-300 shadow-sm focus:border-primary focus:ring-primary p-3 bg-white border"
                                value={formData.jenis_perawatan}
                                onChange={handleChange}
                            >
                                <option value="OliMesin">Oli Mesin</option>
                                <option value="KampasRem">Kampas Rem</option>
                                <option value="Busi">Busi</option>
                                <option value="FilterUdara">Filter Udara</option>
                                <option value="Rantai">Rantai / Pelumasan</option>
                                <option value="GearSet">Gear Set</option>
                                <option value="Ban">Ban</option>
                                <option value="Aki">Aki</option>
                                <option value="MinyakRem">Minyak Rem</option>
                                <option value="KampasKopling">Kampas Kopling</option>
                                <option value="Karburator">Karburator / Injeksi</option>
                                <option value="ShockDepan">Shock Depan</option>
                                <option value="SetelKlep">Setel Klep</option>
                                <option value="ServisRutin">Servis Rutin</option>
                                <option value="Lainnya">Lainnya</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Tanggal</label>
                            <input
                                type="date"
                                name="tanggal_perawatan"
                                required
                                className="w-full rounded-lg border-slate-300 shadow-sm focus:border-primary focus:ring-primary p-3 bg-white border"
                                value={formData.tanggal_perawatan}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Odometer Saat Ini (km)</label>
                        <input
                            type="number"
                            name="odometer_saat_ganti"
                            required
                            placeholder="Contoh: 15000"
                            className="w-full rounded-lg border-slate-300 shadow-sm focus:border-primary focus:ring-primary p-3 bg-white border text-lg font-mono"
                            value={formData.odometer_saat_ganti}
                            onChange={handleChange}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Biaya (Rp)</label>
                        <input
                            type="number"
                            name="biaya"
                            placeholder="Contoh: 50000"
                            className="w-full rounded-lg border-slate-300 shadow-sm focus:border-primary focus:ring-primary p-3 bg-white border"
                            value={formData.biaya}
                            onChange={handleChange}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Nama Bengkel (Opsional)</label>
                        <input
                            type="text"
                            name="nama_bengkel"
                            className="w-full rounded-lg border-slate-300 shadow-sm focus:border-primary focus:ring-primary p-3 bg-white border"
                            value={formData.nama_bengkel}
                            onChange={handleChange}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Foto Struk / Bon</label>
                        <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 flex flex-col items-center justify-center text-slate-400 hover:bg-slate-50 transition-colors relative">
                            <input
                                type="file"
                                accept="image/*"
                                className="absolute inset-0 opacity-0 cursor-pointer"
                                onChange={handleFileChange}
                            />
                            {receipt ? (
                                <div className="text-center">
                                    <p className="text-primary font-medium">{receipt.name}</p>
                                    <p className="text-xs">{(receipt.size / 1024).toFixed(0)} KB</p>
                                </div>
                            ) : (
                                <>
                                    <Camera size={24} className="mb-2" />
                                    <span className="text-sm">Ketuk untuk ambil/upload foto</span>
                                </>
                            )}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Catatan Tambahan</label>
                        <textarea
                            name="detail_spesifik"
                            rows="3"
                            className="w-full rounded-lg border-slate-300 shadow-sm focus:border-primary focus:ring-primary p-3 bg-white border"
                            value={formData.detail_spesifik}
                            onChange={handleChange}
                        ></textarea>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-primary text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-500/30 active:scale-95 transition-transform flex justify-center items-center gap-2 mt-4"
                    >
                        <Save size={20} />
                        {loading ? 'Menyimpan...' : 'Simpan Riwayat'}
                    </button>
                </form>
            )}
        </div>
    );
};

export default AddService;
