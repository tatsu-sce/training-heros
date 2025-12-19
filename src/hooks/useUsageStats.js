import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';

export const useUsageStats = (period = 'week') => {
    const { user } = useAuth();
    const [stats, setStats] = useState({
        totalTime: 0,
        visitCount: 0,
        gymTime: 0,
        calories: 0,
        equipmentStats: [],
        dailyActivity: [],
        recentLogs: []
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (user) {
            fetchStats();
        }
    }, [user, period]);

    const fetchStats = async () => {
        setLoading(true);
        try {
            const now = new Date();
            let startDate = new Date();

            switch (period) {
                case 'day':
                    startDate.setHours(0, 0, 0, 0);
                    break;
                case 'week':
                    startDate.setDate(now.getDate() - 7);
                    break;
                case 'month':
                    startDate.setMonth(now.getMonth() - 1);
                    break;
                case 'total':
                    startDate = new Date(0);
                    break;
                default:
                    startDate.setDate(now.getDate() - 7);
            }

            // 1. Fetch Occupancy Logs (Visits)
            const { data: occupancyLogs, error: occError } = await supabase
                .from('occupancy_logs')
                .select('*')
                .eq('user_id', user.id)
                .gte('created_at', startDate.toISOString())
                .order('created_at', { ascending: true });

            if (occError) throw occError;

            // 2. Fetch Equipment Logs
            const { data: equipmentLogs, error: equipError } = await supabase
                .from('equipment_logs')
                .select('*')
                .eq('user_id', user.id)
                .gte('created_at', startDate.toISOString());

            if (equipError) throw equipError;

            // --- Process Data ---
            const checkIns = occupancyLogs ? occupancyLogs.filter(log => log.action === 'check_in') : [];
            const checkOuts = occupancyLogs ? occupancyLogs.filter(log => log.action === 'check_out') : [];
            const visitCount = checkIns.length;

            const equipDurationSeconds = equipmentLogs?.reduce((sum, log) => sum + (log.duration_seconds || 0), 0) || 0;
            const actualGymTimeMinutes = checkOuts.reduce((sum, log) => sum + (log.duration_minutes || 0), 0);

            // Equipment Stats
            const eqMap = {};
            equipmentLogs?.forEach(log => {
                const name = log.equipment_name || 'Unknown';
                if (!eqMap[name]) eqMap[name] = 0;
                eqMap[name] += (log.duration_seconds || 0);
            });
            const equipmentStats = Object.entries(eqMap)
                .map(([name, sec]) => ({ name, minutes: Math.round(sec / 60) }))
                .sort((a, b) => b.minutes - a.minutes);

            // Daily Activity
            const activityMap = {};
            checkIns.forEach(log => {
                const date = new Date(log.created_at).toLocaleDateString();
                if (!activityMap[date]) activityMap[date] = 0;
                activityMap[date]++;
            });
            const dailyActivity = Object.entries(activityMap).map(([date, count]) => ({ date, count }));

            setStats({
                totalTime: actualGymTimeMinutes,
                visitCount,
                gymTime: actualGymTimeMinutes,
                calories: Math.round(equipDurationSeconds / 60 * 5 + visitCount * 100),
                equipmentStats,
                dailyActivity,
                recentLogs: equipmentLogs ? [...equipmentLogs].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 10) : []
            });

        } catch (error) {
            console.error("Error fetching stats:", error);
        } finally {
            setLoading(false);
        }
    };

    return { stats, loading, refreshStats: fetchStats };
};
