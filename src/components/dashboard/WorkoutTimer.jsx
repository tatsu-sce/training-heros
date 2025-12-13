import React, { useState, useEffect } from 'react';

const WorkoutTimer = () => {
    const [time, setTime] = useState(0);
    const [isRunning, setIsRunning] = useState(false);
    const [mode, setMode] = useState('stopwatch'); // 'stopwatch' or 'timer'
    const [preset, setPreset] = useState(60); // default countdown start

    useEffect(() => {
        let interval;
        if (isRunning) {
            interval = setInterval(() => {
                if (mode === 'stopwatch') {
                    setTime(prev => prev + 1);
                } else {
                    setTime(prev => {
                        if (prev <= 0) {
                            setIsRunning(false);
                            return 0;
                        }
                        return prev - 1;
                    });
                }
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isRunning, mode]);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleStartStop = () => setIsRunning(!isRunning);

    const handleReset = () => {
        setIsRunning(false);
        setTime(mode === 'stopwatch' ? 0 : preset);
    };

    const setTimerValues = (val) => {
        setIsRunning(false);
        setMode('timer');
        setPreset(val);
        setTime(val);
    };

    return (
        <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '0.5rem', marginTop: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <h4 style={{ fontSize: '0.9rem', margin: 0, color: 'var(--color-text-dim)' }}>Rest Timer</h4>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', fontFamily: 'monospace', color: mode === 'timer' && time === 0 ? 'var(--color-success)' : 'white' }}>
                    {formatTime(time)}
                </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.8rem' }}>
                {[30, 60, 90, 120].map(sec => (
                    <button
                        key={sec}
                        onClick={() => setTimerValues(sec)}
                        style={{
                            flex: 1,
                            padding: '4px',
                            fontSize: '0.75rem',
                            background: preset === sec && mode === 'timer' ? 'rgba(99, 102, 241, 0.3)' : 'rgba(255,255,255,0.05)',
                            color: preset === sec && mode === 'timer' ? '#818cf8' : 'var(--color-text-muted)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '4px'
                        }}
                    >
                        {sec}s
                    </button>
                ))}
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                    onClick={handleStartStop}
                    style={{ flex: 2, background: isRunning ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)', color: isRunning ? '#fca5a5' : '#6ee7b7', border: 'none', padding: '0.5rem', borderRadius: '4px', fontWeight: '600' }}
                >
                    {isRunning ? 'Stop' : 'Start'}
                </button>
                <button
                    onClick={handleReset}
                    style={{ flex: 1, background: 'rgba(255,255,255,0.1)', color: 'white', border: 'none', padding: '0.5rem', borderRadius: '4px' }}
                >
                    Reset
                </button>
            </div>
        </div>
    );
};

export default WorkoutTimer;
