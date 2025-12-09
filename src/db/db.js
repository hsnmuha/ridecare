import Dexie from 'dexie';

export const db = new Dexie('RideCareDB');

db.version(1).stores({
    motors: '++id, &motor_id, nama_motor, merek, model, tahun, no_polisi', // motor_id is UUID
    services: '++id, perawatan_id, motor_id, jenis_perawatan, tanggal_perawatan, [motor_id+jenis_perawatan]',
    odometers: '++id, odometer_catat_id, motor_id, tanggal_catat, [motor_id+tanggal_catat]',
});

// Helper to reset DB for debugging
export const resetDB = async () => {
    await db.delete();
    await db.open();
}
