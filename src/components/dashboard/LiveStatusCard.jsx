import React from 'react';
import { useTranslation } from 'react-i18next';

const LiveStatusCard = ({ data }) => {
    const { t } = useTranslation();
    const { occupancy, maxCapacity, percentage, status, loading } = data;

    if (loading) return <div className="glass-panel" style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading status...</div>;

    let statusColor = '#22d3ee'; // Cyan (Empty)
    let statusText = "ガラガラ";

    if (status === 'quiet') {
        statusColor = '#60a5fa'; // Blue
        statusText = "空いています";
    } else if (status === 'moderate') {
        statusColor = '#34d399'; // Green
        statusText = "普通";
    } else if (status === 'busy') {
        statusColor = '#facc15'; // Yellow
        statusText = "やや混雑";
    } else if (status === 'crowded') {
        statusColor = '#f87171'; // Red
        statusText = "混雑";
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
                {/* Capacity removed as per user request */}
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
