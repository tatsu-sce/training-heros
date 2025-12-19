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
        <div style={{ marginTop: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h4 style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', margin: 0 }}>混雑履歴 & 予測 (1年間)</h4>
                <div style={{ display: 'flex', gap: '0.8rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.65rem', color: 'var(--color-text-dim)' }}>
                        <div style={{ width: '8px', height: '8px', background: 'var(--color-primary)', borderRadius: '2px' }} /> 実績
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.65rem', color: 'var(--color-text-dim)' }}>
                        <div style={{ width: '8px', height: '8px', border: '1px dashed rgba(99, 102, 241, 0.5)', borderRadius: '2px' }} /> 予測
                    </div>
                </div>
            </div>

            <div 
                ref={scrollContainerRef}
                style={{
                    display: 'flex',
                    alignItems: 'flex-end',
                    height: '160px',
                    gap: '2px',
                    paddingBottom: '25px',
                    borderBottom: '1px solid rgba(255,255,255,0.1)',
                    overflowX: 'auto',
                    scrollbarWidth: 'none',
                    scrollBehavior: 'smooth'
                }}
            >
                {allData.map((d, i) => (
                    <div 
                        key={i} 
                        data-today={d.isToday}
                        style={{
                            flex: '0 0 10px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            position: 'relative'
                        }}
                    >
                        <div
                            style={{
                                width: '100%',
                                height: `${d.value}%`,
                                background: d.isFuture 
                                    ? 'transparent' 
                                    : d.isToday ? 'white' : 'linear-gradient(to top, var(--color-primary), #818cf8)',
                                border: d.isFuture ? '1px dashed rgba(99, 102, 241, 0.5)' : 'none',
                                opacity: d.isFuture ? 0.3 : (d.isToday ? 1 : 0.7),
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
                                whiteSpace: 'nowrap'
                            }}>
                                TODAY
                            </div>
                        )}
                    </div>
                ))}
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--color-text-dim)', marginTop: '1.2rem', padding: '0 0.5rem' }}>
                <span>1年前</span>
                <span style={{ color: 'var(--color-primary-light)' }}>今日</span>
                <span>1週間後</span>
            </div>
            
            <p style={{ marginTop: '0.8rem', fontSize: '0.65rem', color: 'var(--color-text-dim)', fontStyle: 'italic', textAlign: 'center' }}>
                ※過去1年間の曜日別平均データに基づき、高精度な予測を表示しています。
            </p>
        </div>
    );
};

export default OccupancyChart;
