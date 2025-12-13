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
                        <MetricCard label="Cals" value={stats.calories} unit="kcal" icon="🔥" />
                        <MetricCard label="Active" value={stats.totalTime} unit="min" icon="⏱️" />
                    </div>
                </div>
            )}
        </div>
    );
};

export default UsageSummary;
