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
            const parsed = JSON.parse(stored);
            // Validation: Must be object and not null
            if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
                return { ...SERVICE_INTERVALS, ...parsed };
            }
        }
    } catch (e) {
        console.error("Error loading intervals", e);
        // Safely clear bad data
        try { localStorage.removeItem('ridecare_intervals'); } catch { }
    }
    return SERVICE_INTERVALS;
}

export const calculateStatus = (allServices, currentOdometer, currentDate = new Date(), customIntervals = null) => {
    // 1. Get Active Intervals Safely
    const activeIntervals = customIntervals || getIntervals();

    // Safety check: Ensure activeIntervals is a valid object
    if (!activeIntervals || typeof activeIntervals !== 'object') {
        return { status: 'safe', message: 'Konfigurasi Error', details: [] };
    }

    const validTypes = Object.keys(SERVICE_INTERVALS);

    // 2. Initialize Components based on VALID types only
    // This filters out any garbage keys from customIntervals
    const components = validTypes.map(type => {
        const intervalDef = activeIntervals[type] || SERVICE_INTERVALS[type] || { km: 5000, months: 6 };
        return {
            type,
            status: 'safe',
            percentKm: 0,
            percentTime: 0,
            message: 'Belum ada data',
            kmRemaining: intervalDef.km || 5000,
            daysRemaining: (intervalDef.months || 6) * 30,
            isOverdue: false,
            interval: intervalDef,
            lastServiceDate: null,
            lastServiceOdo: null
        };
    });

    // 3. If no services, return safe default
    if (!allServices || !Array.isArray(allServices) || allServices.length === 0) {
        return {
            status: 'safe',
            message: 'Siap digunakan',
            details: components
        };
    }

    // 4. Sort Services safely
    const sortedServices = [...allServices].sort((a, b) => {
        const dateA = new Date(a.tanggal_perawatan);
        const dateB = new Date(b.tanggal_perawatan);
        return (isNaN(dateB.getTime()) ? 0 : dateB) - (isNaN(dateA.getTime()) ? 0 : dateA);
    });

    // 5. Analyze each component
    let worstStatusPriority = 0; // 0: safe, 1: warning, 2: danger

    const analyzedComponents = components.map(comp => {
        // Find the LATEST service for this specific type
        const lastService = sortedServices.find(s => s.jenis_perawatan === comp.type);

        if (!lastService) return comp;

        const { odometer_saat_ganti, tanggal_perawatan } = lastService;
        const interval = comp.interval;

        // Safe conversions
        const safeCurrentOdo = Number(currentOdometer) || 0;
        const safeServiceOdo = Number(odometer_saat_ganti) || 0;

        let kmDiff = safeCurrentOdo - safeServiceOdo;

        // Handle date safely
        let timeDiff = 0;
        try {
            const serviceDate = new Date(tanggal_perawatan);
            if (isNaN(serviceDate.getTime())) throw new Error("Invalid Date");
            timeDiff = differenceInDays(currentDate, serviceDate);
        } catch (e) {
            timeDiff = 0; // Fallback
        }

        // Avoid division by zero
        const kmLimit = Number(interval.km) || 10000;
        const timeLimit = (Number(interval.months) || 12) * 30;

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
        } else if (maxPercent >= 80) { // Warning threshold
            status = 'warning';
            message = 'Mendekati Jadwal';
            worstStatusPriority = Math.max(worstStatusPriority, 1);
        }

        return {
            type: comp.type,
            status,
            percentKm: isNaN(percentKm) ? 0 : percentKm,
            percentTime: isNaN(percentTime) ? 0 : percentTime,
            message,
            kmRemaining: kmLimit - kmDiff,
            daysRemaining: timeLimit - timeDiff,
            isOverdue,
            interval,
            lastServiceDate: tanggal_perawatan,
            lastServiceOdo: odometer_saat_ganti
        };
    });

    // 6. Determine Global Status
    let globalStatus = 'safe';
    let globalMessage = 'Kondisi Prima';

    if (worstStatusPriority === 2) {
        globalStatus = 'danger';
        const issues = analyzedComponents.filter(c => c.status === 'danger').map(c => c.type);
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
            const priority = { danger: 0, warning: 1, safe: 2 };
            return priority[a.status] - priority[b.status];
        })
    };
};

export const predictNextService = (lastService) => {
    if (!lastService) return null;
    const { jenis_perawatan, odometer_saat_ganti, tanggal_perawatan } = lastService;
    const intervals = getIntervals();
    const interval = intervals[jenis_perawatan] || intervals.ServisRutin || { km: 5000, months: 6 };

    let nextDate = new Date();
    try {
        const date = new Date(tanggal_perawatan);
        if (!isNaN(date)) {
            nextDate = addMonths(date, interval.months || 6);
        }
    } catch (e) { }

    return {
        nextKm: (Number(odometer_saat_ganti) || 0) + (Number(interval.km) || 5000),
        nextDate: nextDate,
    };
}

export const generateId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}
