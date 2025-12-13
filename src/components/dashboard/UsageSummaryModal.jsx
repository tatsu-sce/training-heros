import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabaseClient';

const UsageSummaryModal = ({ isOpen, onClose }) => {
    const { user } = useAuth();
    const [period, setPeriod] = useState('week'); // 'day', 'week', 'month', 'total'
    const [stats, setStats] = useState({
        totalTime: 0,
        visitCount: 0,
        calories: 0,
        equipmentStats: [],
        dailyActivity: [] // for chart
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && user) {
            fetchStats();
        }
    }, [isOpen, user, period]);

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
                    startDate = new Date(0); // Beginning of time
                    break;
                default:
                    startDate.setDate(now.getDate() - 7);
            }

            // 1. Fetch Occupancy Logs (Check-ins) for Visits & Duration (Mocked logic for duration if checkout missing)
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

            // Visits (Count check-ins)
            const checkIns = occupancyLogs ? occupancyLogs.filter(log => log.action === 'check_in') : [];
            const visitCount = checkIns.length;

            // Total Time (Estimate: Check-in to Check-out, or avg 1h if no checkout)
            // Ideally we match check-in with next check-out.
            let totalTimeMinutes = 0;
            // Simplified calculation: Equipment usage time + (Visits * 45mins base)? 
            // Better: Sum of equipment logs duration + standard workout time?
            // Let's use equipment duration for "Active Time" and Visit count for "Visits".

            const equipDurationSeconds = equipmentLogs?.reduce((sum, log) => sum + (log.duration_seconds || 0), 0) || 0;

            // Just for demo, let's assume each visit is roughly 60 mins if checkout is missing, 
            // or sum actual pairs if we had robust logic. For now, let's use Equipment Time as highly accurate metric,
            // and Visits * 60m as "Total Gym Time".
            const estimatedGymTimeMinutes = visitCount * 60;

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

            // Daily Activity (for chart)
            // Group visits by date
            const activityMap = {};
            // Init empty dates if needed, but let's just map existing logs
            checkIns.forEach(log => {
                const date = new Date(log.created_at).toLocaleDateString();
                if (!activityMap[date]) activityMap[date] = 0;
                activityMap[date]++; // Count visits
            });
            const dailyActivity = Object.entries(activityMap).map(([date, count]) => ({ date, count }));

            setStats({
                totalTime: Math.round(equipDurationSeconds / 60), // Active machine time
                visitCount,
                gymTime: estimatedGymTimeMinutes,
                calories: Math.round(equipDurationSeconds / 60 * 5 + visitCount * 100), // Rough estimate
                equipmentStats,
                dailyActivity
            });

        } catch (error) {
            console.error("Error fetching stats:", error);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
            background: 'rgba(0,0,0,0.8)', zIndex: 1000,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            backdropFilter: 'blur(5px)'
        }} onClick={onClose}>
            <div
                className="glass-panel slide-up"
                style={{ width: '90%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', padding: '2rem' }}
                onClick={e => e.stopPropagation()}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h2 style={{ fontSize: '1.5rem' }} className="gradient-text">Usage Summary</h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'white', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
                </div>

                {/* Period Selector */}
                <div style={{ display: 'flex', background: 'rgba(255,255,255,0.1)', borderRadius: '8px', padding: '4px', marginBottom: '2rem' }}>
                    {['day', 'week', 'month', 'total'].map(p => (
                        <button
                            key={p}
                            onClick={() => setPeriod(p)}
                            style={{
                                flex: 1,
                                padding: '8px',
                                background: period === p ? 'var(--color-primary)' : 'transparent',
                                color: period === p ? 'white' : 'var(--color-text-dim)',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                textTransform: 'capitalize',
                                transition: 'all 0.2s',
                                fontWeight: period === p ? '600' : '400'
                            }}
                        >
                            {p === 'total' ? 'All' : `1 ${p}`}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-dim)' }}>Loading stats...</div>
                ) : (
                    <div className="fade-in">
                        {/* Key Metrics */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
                            <MetricCard label="Gym Visits" value={stats.visitCount} unit="times" icon="📍" />
                            <MetricCard label="Est. Calories" value={stats.calories} unit="kcal" icon="🔥" />
                            <MetricCard label="Machine Time" value={stats.totalTime} unit="min" icon="⏱️" />
                            <MetricCard label="Total Stay" value={stats.gymTime} unit="min" icon="🏠" />
                        </div>

                        {/* Chart Area (Simplified Bar Chart) */}
                        <div style={{ marginBottom: '2rem' }}>
                            <h3 style={{ fontSize: '1rem', marginBottom: '1rem', color: 'var(--color-text-muted)' }}>Top Equipment</h3>
                            {stats.equipmentStats.length > 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                                    {stats.equipmentStats.map((item, i) => (
                                        <div key={item.name} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                            <div style={{ width: '120px', fontSize: '0.9rem', color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</div>
                                            <div style={{ flex: 1, background: 'rgba(255,255,255,0.1)', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                                                <div style={{
                                                    width: `${Math.min((item.minutes / (stats.equipmentStats[0].minutes || 1)) * 100, 100)}%`,
                                                    height: '100%',
                                                    background: i === 0 ? 'var(--color-primary)' : '#818cf8',
                                                    borderRadius: '4px'
                                                }} />
                                            </div>
                                            <div style={{ width: '50px', fontSize: '0.8rem', color: 'var(--color-text-dim)', textAlign: 'right' }}>{item.minutes}m</div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--color-text-dim)', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                                    No equipment usage logged for this period.
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const MetricCard = ({ label, value, unit, icon }) => (
    <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '12px', padding: '1.2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
        <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{icon}</div>
        <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'white', lineHeight: '1' }}>{value}</div>
        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-dim)', marginTop: '0.2rem' }}>{label} ({unit})</div>
    </div>
);

export default UsageSummaryModal;
