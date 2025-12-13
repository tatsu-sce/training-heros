import React from 'react';

const OccupancyChart = () => {
    // Generate mock data for the last 30 days
    const data = Array.from({ length: 30 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (29 - i));
        return {
            date: `${date.getMonth() + 1}/${date.getDate()}`,
            value: Math.floor(Math.random() * 80) + 20 // Random occupancy 20-100%
        };
    });

    return (
        <div style={{ marginTop: '2rem' }}>
            <h4 style={{ fontSize: '0.9rem', marginBottom: '1rem', color: 'var(--color-text-muted)' }}>過去30日の混雑傾向</h4>

            <div style={{
                display: 'flex',
                alignItems: 'flex-end',
                height: '150px',
                gap: '4px',
                paddingBottom: '20px',
                borderBottom: '1px solid rgba(255,255,255,0.1)',
                overflowX: 'auto'
            }}>
                {data.map((d, i) => (
                    <div key={i} style={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        minWidth: '20px'
                    }}>
                        <div
                            style={{
                                width: '100%',
                                height: `${d.value}%`,
                                background: 'linear-gradient(to top, var(--color-primary), #818cf8)',
                                borderRadius: '4px 4px 0 0',
                                opacity: 0.8,
                                transition: 'height 0.5s ease',
                                position: 'relative'
                            }}
                            title={`Date: ${d.date}, Occupancy: ${d.value}%`}
                        />
                        {/* Show date for every 5th item to avoid clutter */}
                        {i % 5 === 0 && (
                            <span style={{
                                position: 'absolute',
                                bottom: '0',
                                fontSize: '0.6rem',
                                color: 'var(--color-text-dim)',
                                transform: 'translateY(100%)'
                            }}>
                                {d.date}
                            </span>
                        )}
                    </div>
                ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--color-text-dim)', marginTop: '0.5rem' }}>
                <span>30日前</span>
                <span>今日</span>
            </div>
        </div>
    );
};

export default OccupancyChart;
