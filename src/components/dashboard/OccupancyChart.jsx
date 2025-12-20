import React from 'react';

const OccupancyChart = () => {
    // Generated Time Slots: 10:00 to 18:00 (30 min intervals)
    const timeSlots = React.useMemo(() => {
        const slots = [];
        for (let h = 10; h <= 18; h++) {
            slots.push(`${h}:00`);
            if (h !== 18) slots.push(`${h}:30`);
        }
        return slots;
    }, []);

    // Helper: Generate random data for one day (array of values matching timeSlots)
    const generateDayData = () => {
        return timeSlots.map(time => {
            const hour = parseInt(time.split(':')[0]);
            // Simulate peak hours around 12:00 and 17:00
            let base = 1;
            if (hour >= 11 && hour <= 13) base += 2; // Lunch peak
            if (hour >= 17) base += 2; // Evening peak
            
            // Random noise
            const noise = Math.floor(Math.random() * 3) - 1;
            return Math.max(0, Math.min(5, base + noise));
        });
    };

    // 1. Generate Past 30 Days Data
    const pastMonthData = React.useMemo(() => {
        return Array.from({ length: 30 }, () => generateDayData());
    }, [timeSlots]);

    // 2. Calculate Predicted (Average of past 30 days per slot)
    const predictedData = React.useMemo(() => {
        const sums = new Array(timeSlots.length).fill(0);
        pastMonthData.forEach(dayDat => {
            dayDat.forEach((val, idx) => {
                sums[idx] += val;
            });
        });
        return sums.map(sum => Math.round(sum / 30));
    }, [pastMonthData, timeSlots]);

    // 3. Generate "Actual" Data (Today)
    const actualData = React.useMemo(() => {
        const fullDayData = generateDayData();
        const now = new Date();
        const currentHour = now.getHours();
        const currentMin = now.getMinutes();

        return fullDayData.map((val, i) => {
            const timeStr = timeSlots[i];
            const [hStr, mStr] = timeStr.split(':');
            const slotHour = parseInt(hStr, 10);
            const slotMin = parseInt(mStr, 10);

            // If slot is in the future, return null
            if (slotHour > currentHour || (slotHour === currentHour && slotMin > currentMin)) {
                return null;
            }
            return val;
        });
    }, [timeSlots]);

    // Determine Y-axis Max for scaling (ignore nulls)
    const validActuals = actualData.filter(d => d !== null);
    // Ensure max is at least 5 for scale
    const maxValue = Math.max(5, ...predictedData, ...validActuals) + 1;

    // Find current index to highlight
    const currentIndex = React.useMemo(() => {
        const now = new Date();
        const currentHour = now.getHours();
        const currentMin = now.getMinutes();
        
        // Find the slot that matches the current time (rounding down to nearest 30min)
        return timeSlots.findIndex(slot => {
            const [hStr, mStr] = slot.split(':');
            const h = parseInt(hStr, 10);
            const m = parseInt(mStr, 10);
            
            // Check if match 
            // Logic: if current time is 10:15, matches 10:00. if 10:45, matches 10:30.
            if (h === currentHour) {
                return currentMin >= 30 ? m === 30 : m === 0;
            }
            return false;
        });
    }, [timeSlots]);

    return (
        <div className="glass-panel" style={{ marginTop: '2rem', padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h4 style={{ fontSize: '1rem', color: 'var(--color-text-main)', margin: 0, fontWeight: '600' }}>
                    本日の混雑状況 (10:00 - 18:00)
                </h4>
                <div style={{ display: 'flex', gap: '0.8rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.7rem', color: 'var(--color-text-dim)' }}>
                        <div style={{ width: '12px', height: '12px', background: 'rgba(255,255,255,0.1)', border: '1px dashed rgba(255,255,255,0.4)', borderRadius: '2px' }} /> 
                        予測
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.7rem', color: 'var(--color-text-dim)' }}>
                        <div style={{ width: '12px', height: '12px', background: 'var(--color-primary)', borderRadius: '2px' }} /> 
                        実績
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.7rem', color: 'var(--color-text-dim)' }}>
                        <div style={{ width: '12px', height: '12px', background: '#ec4899', borderRadius: '2px', boxShadow: '0 0 5px #ec4899' }} /> 
                        現在 (Live)
                    </div>
                </div>
            </div>

            <div style={{ height: '220px', display: 'flex', flexDirection: 'column' }}>
                <div style={{ flex: 1, display: 'flex', position: 'relative' }}>
                    
                    {/* Y-Axis Labels */}
                    <div style={{ 
                        display: 'flex', 
                        flexDirection: 'column', 
                        justifyContent: 'space-between', 
                        paddingRight: '10px', 
                        fontSize: '0.65rem',
                        color: 'var(--color-text-dim)',
                        textAlign: 'right',
                        width: '30px',
                        borderRight: '1px solid rgba(255,255,255,0.1)'
                    }}>
                        <span>{Math.round(maxValue)}人</span>
                        <span>{Math.round(maxValue / 2)}人</span>
                        <span>0人</span>
                    </div>

                    {/* Chart Area */}
                    <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', paddingLeft: '10px', position: 'relative' }}>
                        
                        {/* Grid Lines */}
                        <div style={{ position: 'absolute', top: 0, left: 10, right: 0, height: '100%', pointerEvents: 'none' }}>
                            <div style={{ position: 'absolute', top: '0%', width: '100%', borderTop: '1px dashed rgba(255,255,255,0.05)' }} />
                            <div style={{ position: 'absolute', top: '50%', width: '100%', borderTop: '1px dashed rgba(255,255,255,0.05)' }} />
                            <div style={{ position: 'absolute', bottom: '0%', width: '100%', borderTop: '1px solid rgba(255,255,255,0.1)' }} />
                        </div>

                        {/* Bars */}
                        <div style={{ 
                            display: 'flex', 
                            width: '100%', 
                            height: '100%', 
                            alignItems: 'flex-end', 
                            justifyContent: 'space-between',
                            zIndex: 1
                        }}>
                            {timeSlots.map((time, i) => {
                                const predH = (predictedData[i] / maxValue) * 100;
                                const actH = (actualData[i] / maxValue) * 100;
                                const isCurrent = i === currentIndex;
                                const barColor = isCurrent ? '#ec4899' : 'var(--color-primary)'; // Pink for Live

                                return (
                                    <div key={time} style={{ 
                                        flex: 1, 
                                        height: '100%', 
                                        display: 'flex', 
                                        flexDirection: 'column', 
                                        justifyContent: 'flex-end', 
                                        alignItems: 'center',
                                        position: 'relative',
                                        maxWidth: '40px' 
                                    }}>
                                        {/* Bar Group */}
                                        <div style={{ 
                                            position: 'relative', 
                                            width: '60%', 
                                            height: '100%',
                                            display: 'flex',
                                            alignItems: 'flex-end',
                                            justifyContent: 'center'
                                        }}>
                                            {/* Predicted Bar (Background) - Hide if current */}
                                            {!isCurrent && (
                                                <div 
                                                    title={`予測: ${predictedData[i]}人`}
                                                    style={{
                                                        position: 'absolute',
                                                        bottom: 0,
                                                        width: '100%',
                                                        height: `${predH}%`,
                                                        background: 'rgba(255,255,255,0.1)',
                                                        border: '1px dashed rgba(255,255,255,0.3)',
                                                        borderRadius: '2px 2px 0 0',
                                                        transition: 'height 0.4s ease'
                                                    }}
                                                />
                                            )}                                  {actualData[i] !== null && (
                                                <div 
                                                    title={`実績: ${actualData[i]}人`}
                                                    style={{
                                                        position: 'absolute',
                                                        bottom: 0,
                                                        width: '70%',
                                                        height: `${actH}%`,
                                                        background: barColor,
                                                        borderRadius: '2px 2px 0 0',
                                                        opacity: 0.9,
                                                        boxShadow: isCurrent 
                                                            ? `0 0 15px ${barColor}, 0 0 5px white` // Glow effect
                                                            : '0 0 8px rgba(99, 102, 241, 0.3)',
                                                        transition: 'height 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
                                                        zIndex: isCurrent ? 2 : 1
                                                    }}
                                                >
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* X-Axis Labels */}
                <div style={{ display: 'flex', paddingLeft: '40px', marginTop: '8px', justifyContent: 'space-between' }}>
                    {timeSlots.map((time, i) => {
                        const isCurrent = i === currentIndex;
                        // Show labels every 2 hours or if it is current time (priority)
                        if (i % 4 === 0 || i === timeSlots.length - 1 || isCurrent) {
                            return (
                                <span key={time} style={{ 
                                    fontSize: '0.65rem', 
                                    color: isCurrent ? 'white' : 'var(--color-text-dim)', 
                                    fontWeight: isCurrent ? 'bold' : 'normal',
                                    textShadow: isCurrent ? '0 0 8px var(--color-primary)' : 'none',
                                    transform: 'translateX(-50%)' 
                                }}>
                                    {time}
                                </span>
                            );
                        }
                        return <div key={time} style={{ width: '1px' }} />; // Spacer
                    })}
                </div>
            </div>
        </div>
    );
};

export default OccupancyChart;
