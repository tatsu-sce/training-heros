import React from 'react';
import { useTranslation } from 'react-i18next';

const LiveStatusCard = ({ data }) => {
    const { t } = useTranslation();
    const { occupancy, maxCapacity, percentage, status, loading } = data;

    if (loading) return <div className="glass-panel" style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading status...</div>;

    let statusColor = 'var(--color-success)';
    let statusText = t('low_traffic');

    if (status === 'medium') {
        statusColor = 'var(--color-warning)';
        statusText = "Moderate Traffic";
    } else if (status === 'high') {
        statusColor = 'var(--color-error)';
        statusText = "High Traffic - Busy";
    }

    return (
        <div className="glass-panel" style={{ padding: '2rem' }}>
            <h2 style={{ marginBottom: '1rem', fontSize: '1.2rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                {t('occupancy')}
            </h2>

            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '1rem', marginBottom: '1rem' }}>
                <span style={{ fontSize: '4.5rem', fontWeight: '800', lineHeight: 1, color: 'var(--color-text-main)' }}>
                    {occupancy}
                </span>
                <span style={{ fontSize: '1.2rem', color: 'var(--color-text-dim)', paddingBottom: '0.9rem', fontWeight: '500' }}>
                    / {maxCapacity} users
                </span>
            </div>

            <div style={{ position: 'relative', width: '100%', height: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '999px', overflow: 'hidden' }}>
                <div
                    style={{
                        width: `${percentage}%`,
                        height: '100%',
                        background: statusColor,
                        borderRadius: '999px',
                        transition: 'width 0.5s cubic-bezier(0.4, 0, 0.2, 1), background-color 0.5s ease'
                    }}
                ></div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', marginTop: '1rem', gap: '0.5rem' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: statusColor, boxShadow: `0 0 10px ${statusColor}` }}></div>
                <p style={{ color: statusColor, fontSize: '0.95rem', fontWeight: '500' }}>
                    {statusText}
                </p>
            </div>
        </div>
    );
};

export default LiveStatusCard;
