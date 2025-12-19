import React, { useState } from 'react';
import { useUsageStats } from '../../hooks/useUsageStats';

const UsageSummary = () => {
    const [period, setPeriod] = useState('week');
    const { stats, loading } = useUsageStats(period);

    const MetricCard = ({ label, value, unit, icon }) => (
        <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '12px', padding: '1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', flex: 1, minWidth: '90px' }}>
            <div style={{ fontSize: '1.2rem', marginBottom: '0.3rem' }}>{icon}</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: 'white', lineHeight: '1' }}>{value}</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--color-text-dim)', marginTop: '0.2rem' }}>{label} ({unit})</div>
        </div>
    );

    return (
        <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1.1rem', color: 'var(--color-text-muted)' }}>Usage Summary</h3>
                <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', padding: '2px' }}>
                    {['week', 'month'].map(p => (
                        <button
                            key={p}
                            onClick={() => setPeriod(p)}
                            style={{
                                padding: '4px 8px',
                                background: period === p ? 'var(--color-primary)' : 'transparent',
                                color: period === p ? 'white' : 'var(--color-text-dim)',
                                border: 'none',
                                borderRadius: '4px',
                                fontSize: '0.75rem',
                                cursor: 'pointer',
                                textTransform: 'capitalize'
                            }}
                        >
                            {p}
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '1rem', fontSize: '0.8rem', color: 'var(--color-text-dim)' }}>Loading...</div>
            ) : (
                <div className="fade-in">
                    <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap' }}>
                        <MetricCard label="Visits" value={stats.visitCount} unit="x" icon="📍" />
                        <MetricCard label="Stay Time" value={stats.totalTime} unit={stats.timeUnit || 'min'} icon="⏱️" />
                        <MetricCard label="Cals" value={stats.calories} unit="kcal" icon="🔥" />
                    </div>

                    {/* Detailed Recent Activity */}
                    <div style={{ marginTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1rem' }}>
                        <h4 style={{ fontSize: '0.85rem', color: 'var(--color-text-dim)', marginBottom: '0.8rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Recent Activity</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                            {stats.recentLogs && stats.recentLogs.length > 0 ? (
                                stats.recentLogs.slice(0, 5).map((log, idx) => (
                                    <div key={log.id || idx} style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        fontSize: '0.85rem',
                                        background: 'rgba(255,255,255,0.02)',
                                        padding: '0.6rem 0.8rem',
                                        borderRadius: '8px'
                                    }}>
                                        <span style={{ color: 'white', fontWeight: '500' }}>{log.equipment_name}</span>
                                        <span style={{ color: 'var(--color-primary-light)', fontWeight: 'bold' }}>
                                            {log.distance_km
                                                ? `${log.distance_km}km`
                                                : `${log.weight}kg × ${log.reps}`}
                                        </span>
                                    </div>
                                ))
                            ) : (
                                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-dim)', textAlign: 'center', padding: '1rem' }}>No recent activity.</div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UsageSummary;
