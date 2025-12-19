import React from 'react';

const OccupancyChart = () => {
    const scrollContainerRef = React.useRef(null);

    // Initial scroll to "Today"
    React.useEffect(() => {
        if (scrollContainerRef.current) {
            const container = scrollContainerRef.current;
            const todayElement = container.querySelector('[data-today="true"]');
            if (todayElement) {
                const scrollPos = todayElement.offsetLeft - (container.offsetWidth / 2);
                container.scrollLeft = scrollPos;
            }
        }
    }, []);

    // Helper to get base occupancy by day of week
    const getBaseOccupancy = (day) => {
        const patterns = [
            35, // Sun (very low)
            88, // Mon (busy)
            82, // Tue (busy)
            78, // Wed (med-high)
            65, // Thu (med)
            58, // Fri (med)
            42  // Sat (low)
        ];
        return patterns[day] || 50;
    };

    // Generate Past 1 Year Data (365 Days)
    const pastData = React.useMemo(() => Array.from({ length: 365 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (364 - i));
        const day = date.getDay();
        const base = getBaseOccupancy(day);
        const noise = Math.floor(Math.random() * 20) - 10;
        return {
            date: date,
            dateStr: `${date.getMonth() + 1}/${date.getDate()}`,
            monthStr: date.getDate() === 1 ? `${date.getMonth() + 1}月` : null,
            value: Math.min(100, Math.max(0, base + noise)),
            isFuture: false,
            isToday: i === 364
        };
    }), []);

    // Calculate Weekly Averages for Prediction
    const dayAverages = React.useMemo(() => {
        const averages = {};
        pastData.forEach(d => {
            const day = d.date.getDay();
            if (!averages[day]) averages[day] = [];
            averages[day].push(d.value);
        });
        return averages;
    }, [pastData]);

    // Generate Future 7 Days Data
    const futureData = React.useMemo(() => Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() + (i + 1));
        const day = date.getDay();
        const vals = dayAverages[day] || [50];
        const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
        return {
            date: date,
            dateStr: `${date.getMonth() + 1}/${date.getDate()}`,
            monthStr: date.getDate() === 1 ? `${date.getMonth() + 1}月` : null,
            value: Math.round(avg),
            isFuture: true,
            isToday: false
        };
    }), [dayAverages]);

    const allData = [...pastData, ...futureData];

    return (
        <div className="glass-panel" style={{ marginTop: '2rem', padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h4 style={{ fontSize: '1rem', color: 'var(--color-text-main)', margin: 0, fontWeight: '600' }}>混雑履歴 & 予測 (1年間)</h4>
                <div style={{ display: 'flex', gap: '0.8rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.7rem', color: 'var(--color-text-dim)' }}>
                        <div style={{ width: '8px', height: '8px', background: 'var(--color-primary)', borderRadius: '2px' }} /> 実績
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.7rem', color: 'var(--color-text-dim)' }}>
                        <div style={{ width: '8px', height: '8px', background: 'rgba(99, 102, 241, 0.2)', border: '1px dashed rgba(99, 102, 241, 0.8)', borderRadius: '2px' }} /> 予測
                    </div>
                </div>
            </div>

            <div style={{ display: 'flex', height: '200px', position: 'relative' }}>
                {/* Y-Axis Labels */}
                <div style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    justifyContent: 'space-between', 
                    paddingRight: '10px', 
                    paddingBottom: '25px',
                    fontSize: '0.65rem',
                    color: 'var(--color-text-dim)',
                    textAlign: 'right',
                    width: '35px',
                    borderRight: '1px solid rgba(255,255,255,0.1)'
                }}>
                    <span>100%</span>
                    <span>50%</span>
                    <span>0%</span>
                </div>

                <div 
                    ref={scrollContainerRef}
                    style={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'flex-end',
                        gap: '2px',
                        paddingBottom: '25px',
                        overflowX: 'auto',
                        scrollbarWidth: 'none',
                        scrollBehavior: 'smooth',
                        position: 'relative'
                    }}
                >
                    {/* Horizontal Grid Lines */}
                    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: 'calc(100% - 25px)', pointerEvents: 'none' }}>
                        <div style={{ position: 'absolute', top: '0%', width: '100%', borderTop: '1px dashed rgba(255,255,255,0.05)' }} />
                        <div style={{ position: 'absolute', top: '50%', width: '100%', borderTop: '1px dashed rgba(255,255,255,0.05)' }} />
                    </div>

                    {allData.map((d, i) => (
                        <div 
                            key={i} 
                            data-today={d.isToday}
                            style={{
                                flex: '0 0 10px',
                                height: 'calc(100% - 25px)', // Ensure parent has height for percentage children
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'flex-end',
                                alignItems: 'center',
                                position: 'relative'
                            }}
                        >
                            <div
                                style={{
                                    width: '100%',
                                    height: `${d.value}%`,
                                    background: d.isFuture 
                                        ? 'rgba(99, 102, 241, 0.15)' 
                                        : d.isToday ? 'white' : 'var(--color-primary)',
                                    border: d.isFuture ? '1px dashed rgba(99, 102, 241, 0.8)' : 'none',
                                    opacity: d.isFuture ? 0.6 : (d.isToday ? 1 : 0.6),
                                    borderRadius: '2px 2px 0 0',
                                    transition: 'height 0.5s ease',
                                    boxShadow: d.isToday ? '0 0 10px rgba(255,255,255,0.5)' : 'none'
                                }}
                                title={`${d.isFuture ? 'Predicted' : (d.isToday ? 'Today' : 'Past')} ${d.dateStr}: ${d.value}%`}
                            />
                            
                            {/* Month labels for 1st of month or first item */}
                            {(d.monthStr || i === 0) && (
                                <span style={{
                                    position: 'absolute',
                                    bottom: '-20px',
                                    left: '0',
                                    fontSize: '0.6rem',
                                    color: 'var(--color-text-dim)',
                                    whiteSpace: 'nowrap',
                                    paddingLeft: '2px',
                                    borderLeft: '1px solid rgba(255,255,255,0.1)'
                                }}>
                                    {d.monthStr || `${d.date.getMonth() + 1}月`}
                                </span>
                            )}

                            {d.isToday && (
                                <div style={{
                                    position: 'absolute',
                                    top: '-15px',
                                    fontSize: '0.6rem',
                                    color: 'white',
                                    fontWeight: 'bold',
                                    whiteSpace: 'nowrap',
                                    zIndex: 1
                                }}>
                                    TODAY
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--color-text-dim)', marginTop: '0.5rem', padding: '0 0.5rem 0 45px' }}>
                <span>1年前</span>
                <span style={{ color: 'var(--color-primary-light)' }}>今日</span>
                <span>1週間後</span>
            </div>
            
            <p style={{ marginTop: '1.2rem', fontSize: '0.75rem', color: 'var(--color-text-dim)', fontStyle: 'italic', textAlign: 'center' }}>
                ※過去1年間の曜日別平均データに基づき、高精度な予測(混雑率%)を表示しています。
            </p>
        </div>
    );
};

export default OccupancyChart;
