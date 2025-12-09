import { differenceInDays, addMonths, addDays } from 'date-fns';

export const SERVICE_INTERVALS = {
    'OliMesin': { km: 3000, months: 2 },           // 2000-3000 km
    'KampasKopling': { km: 20000, months: 24 },    // Check 8-12k, Replace 20-40k
    'GearSet': { km: 20000, months: 18 },          // 12-20k km
    'Rantai': { km: 500, months: 1 },              // 500 km
    'Busi': { km: 10000, months: 12 },             // 8-12k km
    'FilterUdara': { km: 12000, months: 12 },      // Replace 12-16k
    'Karburator': { km: 8000, months: 6 },         // 4-8k / 8-12k
    'Aki': { km: 20000, months: 18 },              // 1.5 - 2.5 years
    'KampasRem': { km: 10000, months: 12 },        // 8-15k km
    'MinyakRem': { km: 20000, months: 24 },        // 1-2 years
    'Ban': { km: 15000, months: 18 },              // 10-20k km
    'ShockDepan': { km: 15000, months: 18 },       // 15-20k km
    'SetelKlep': { km: 10000, months: 12 },        // 8-12k km
    'ServisRutin': { km: 5000, months: 4 },        // Fallback
};

// Helper to get intervals (merging default with custom)
export const getIntervals = () => {
    try {
        const stored = localStorage.getItem('ridecare_intervals');
        if (stored) {
            return { ...SERVICE_INTERVALS, ...JSON.parse(stored) };
        }
    } catch (e) {
        console.error("Error loading intervals", e);
    }
    return SERVICE_INTERVALS;
}

export const calculateStatus = (allServices, currentOdometer, currentDate = new Date(), customIntervals = null) => {
    // Use provided customIntervals or fetch them
    const activeIntervals = customIntervals || getIntervals();

    // 1. Initialize Default Status for all Components
    const components = Object.keys(activeIntervals).map(type => ({
        type,
        status: 'safe', // Changed from danger to safe as per user request
        percentKm: 0,
        percentTime: 0,
        message: 'Belum ada data',
        kmRemaining: activeIntervals[type].km, // Full interval available
        daysRemaining: activeIntervals[type].months * 30, // Full time available
        isOverdue: false,
        interval: activeIntervals[type] // Include interval info
    }));

    // 2. If no services at all, return generic safe implies new motor
    if (!allServices || allServices.length === 0) {
        return {
            status: 'safe',
            message: 'Siap digunakan',
            details: components
        };
    }

    // 3. Evaluate each component type based on its LAST service
    let worstStatusPriority = 0; // 0: safe, 1: warning, 2: danger

    // Create a time-sorted copy of services once to avoid repeated sorting
    const sortedServices = [...allServices].sort((a, b) => new Date(b.tanggal_perawatan) - new Date(a.tanggal_perawatan));

    const analyzedComponents = components.map(comp => {
        // Find the LATEST service for this specific type
        const lastService = sortedServices.find(s => s.jenis_perawatan === comp.type);

        if (!lastService) {
            // Never serviced - treat as SAFE now
            return comp;
        }

        const { odometer_saat_ganti, tanggal_perawatan } = lastService;
        const interval = activeIntervals[comp.type];

        const kmDiff = currentOdometer - odometer_saat_ganti;
        const timeDiff = differenceInDays(currentDate, new Date(tanggal_perawatan));

        const kmLimit = interval.km;
        const timeLimit = interval.months * 30; // approx

        const percentKm = Math.min(100, (kmDiff / kmLimit) * 100);
        const percentTime = Math.min(100, (timeDiff / timeLimit) * 100);

        const maxPercent = Math.max(percentKm, percentTime);

        let status = 'safe';
        let message = 'Aman';
        let isOverdue = false;

        if (maxPercent >= 100) {
            status = 'danger';
            message = 'Ganti Segera!';
            isOverdue = true;
            worstStatusPriority = Math.max(worstStatusPriority, 2);
        } else if (maxPercent >= 80) { // Changed threshold to 80% for warning
            status = 'warning';
            message = 'Mendekati Jadwal';
            worstStatusPriority = Math.max(worstStatusPriority, 1);
        }

        return {
            type: comp.type,
            status,
            percentKm,
            percentTime,
            message,
            kmRemaining: kmLimit - kmDiff,
            daysRemaining: timeLimit - timeDiff,
            isOverdue,
            interval, // Pass back interval data
            lastServiceDate: tanggal_perawatan, // Helpful for UI
            lastServiceOdo: odometer_saat_ganti
        };
    });

    // 4. Determine Global Status
    let globalStatus = 'safe';
    let globalMessage = 'Kondisi Prima';

    if (worstStatusPriority === 2) {
        globalStatus = 'danger';
        // Find what is wrong
        const issues = analyzedComponents.filter(c => c.status === 'danger').map(c => c.type);
        // Only show top 2 to avoid clutter
        globalMessage = `Periksa: ${issues.slice(0, 2).join(', ')}${issues.length > 2 ? '...' : ''}`;
    } else if (worstStatusPriority === 1) {
        globalStatus = 'warning';
        const warnings = analyzedComponents.filter(c => c.status === 'warning').map(c => c.type);
        globalMessage = `Siapkan: ${warnings.slice(0, 2).join(', ')}${warnings.length > 2 ? '...' : ''}`;
    }

    return {
        status: globalStatus,
        message: globalMessage,
        details: analyzedComponents.sort((a, b) => {
            // Sort by urgency (danger first, then warning, then safe)
            const priority = { danger: 0, warning: 1, safe: 2 };
            return priority[a.status] - priority[b.status];
        })
    };
};

export const predictNextService = (lastService) => {
    if (!lastService) return null;
    const { jenis_perawatan, odometer_saat_ganti, tanggal_perawatan } = lastService;
    const intervals = getIntervals();
    const interval = intervals[jenis_perawatan] || intervals.ServisRutin;

    return {
        nextKm: odometer_saat_ganti + interval.km,
        nextDate: addMonths(new Date(tanggal_perawatan), interval.months),
    };
}

export const generateId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}
