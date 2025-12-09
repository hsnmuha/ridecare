import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { addMotor } from '../services/api';
import { ArrowLeft, Save } from 'lucide-react';

export const AddMotor = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        nama_motor: '',
        merek: '',
        model: '',
        tahun: new Date().getFullYear(),
        no_polisi: '',
        odometer_awal: 0,
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await addMotor({
                ...formData,
                tahun: parseInt(formData.tahun),
                odometer_awal: parseInt(formData.odometer_awal),
            });

            navigate('/');
        } catch (error) {
            console.error("Failed to add motor", error);
            alert("Gagal menyimpan data motor.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <div className="flex items-center gap-2 mb-6">
                <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-slate-600 rounded-full hover:bg-slate-100">
                    <ArrowLeft size={24} />
                </button>
                <h2 className="text-xl font-bold text-slate-800">Tambah Motor</h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Nama Panggilan Motor</label>
                    <input
                        type="text"
                        name="nama_motor"
                        required
                        placeholder="Misal: Vario Merah"
                        className="w-full rounded-lg border-slate-300 shadow-sm focus:border-primary focus:ring-primary p-3 bg-white border"
                        onChange={handleChange}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Merek</label>
                        <input
                            type="text"
                            name="merek"
                            placeholder="Honda"
                            className="w-full rounded-lg border-slate-300 shadow-sm focus:border-primary focus:ring-primary p-3 bg-white border"
                            onChange={handleChange}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Model</label>
                        <input
                            type="text"
                            name="model"
                            placeholder="Vario 150"
                            className="w-full rounded-lg border-slate-300 shadow-sm focus:border-primary focus:ring-primary p-3 bg-white border"
                            onChange={handleChange}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Tahun</label>
                        <input
                            type="number"
                            name="tahun"
                            className="w-full rounded-lg border-slate-300 shadow-sm focus:border-primary focus:ring-primary p-3 bg-white border"
                            onChange={handleChange}
                            value={formData.tahun}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">No. Polisi</label>
                        <input
                            type="text"
                            name="no_polisi"
                            placeholder="B 1234 XYZ"
                            className="w-full rounded-lg border-slate-300 shadow-sm focus:border-primary focus:ring-primary p-3 bg-white border"
                            onChange={handleChange}
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Odometer Awal (km)</label>
                    <input
                        type="number"
                        name="odometer_awal"
                        required
                        className="w-full rounded-lg border-slate-300 shadow-sm focus:border-primary focus:ring-primary p-3 bg-white border text-lg font-mono"
                        onChange={handleChange}
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-primary text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-500/30 active:scale-95 transition-transform flex justify-center items-center gap-2 mt-8"
                >
                    <Save size={20} />
                    {loading ? 'Menyimpan...' : 'Simpan Motor'}
                </button>

            </form>
        </div>
    );
};

export default AddMotor;
