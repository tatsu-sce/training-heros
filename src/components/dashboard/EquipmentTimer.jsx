import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';

const EquipmentTimer = ({ equipment, onSave }) => {
    const { user } = useAuth();
    const [selectedId, setSelectedId] = useState(equipment?.id || null);
    const [seconds, setSeconds] = useState(0);
    const [isActive, setIsActive] = useState(false);

    // Recording States
    const [weight, setWeight] = useState('');
    const [reps, setReps] = useState('');
    const [lastLog, setLastLog] = useState(null);
    const [sessionSets, setSessionSets] = useState([]);

    // Auto-select if equipment prop provided
    useEffect(() => {
        if (equipment) {
            setSelectedId(equipment.id);
        }
    }, [equipment]);

    useEffect(() => {
        let interval = null;
        if (isActive) {
            interval = setInterval(() => {
                setSeconds(seconds => seconds + 1);
            }, 1000);
        } else if (!isActive && seconds !== 0) {
            clearInterval(interval);
        }
        return () => clearInterval(interval);
    }, [isActive, seconds]);

    // Fetch Last Log when equipment changes
    useEffect(() => {
        if (!user || !selectedId) return;

        const currentEquipment = equipment;
        if (!currentEquipment) return;

        const fetchLastLog = async () => {
            const { data } = await supabase
                .from('equipment_logs')
                .select('weight, reps, created_at')
                .eq('user_id', user.id)
                .eq('equipment_name', currentEquipment.name)
                .not('weight', 'is', null)
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();

            if (data) setLastLog(data);
            else setLastLog(null);
        };

        fetchLastLog();
        setWeight('');
        setReps('');
        setSessionSets([]);
    }, [user, selectedId, equipment]);

    const handleTimerToggle = () => {
        setIsActive(!isActive);
    };

    const handleTimerReset = () => {
        setSeconds(0);
        setIsActive(false);
    };

    const handleSaveLog = async () => {
        if (!user || !selectedId) return;
        if (!weight || !reps) {
            alert("Please enter both Weight and Reps.");
            return;
        }

        const currentEquipment = equipment;

        try {
            const { error } = await supabase
                .from('equipment_logs')
                .insert({
                    user_id: user.id,
                    equipment_name: currentEquipment.name,
                    duration_seconds: seconds,
                    weight: parseFloat(weight),
                    reps: parseInt(reps)
                });

            if (error) throw error;

            // Update session sets for UI feedback
            setSessionSets(prev => [...prev, { weight, reps, time: formatTime(seconds) }]);
            
            // Clear inputs for next set
            setWeight('');
            setReps('');

        } catch (err) {
            console.error(err);
            alert("Failed to save record.");
        }
    };

    const formatTime = (time) => {
        const minutes = Math.floor(time / 60);
        const seconds = time % 60;
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    if (!selectedId || !equipment) return null;

    return (
        <div className="fade-in" style={{ display: 'flex', gap: '1.2rem', flexDirection: 'column' }}>
            {/* Header info */}
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                {equipment.image && (
                    <img src={equipment.image} alt={equipment.name} style={{ width: '80px', height: '80px', borderRadius: '12px', objectFit: 'cover' }} />
                )}
                <div style={{ flex: 1 }}>
                    <h4 style={{ fontSize: '1.2rem', fontWeight: 'bold', margin: '0 0 0.3rem 0' }}>{equipment.name}</h4>
                    {lastLog ? (
                        <p style={{ fontSize: '0.85rem', color: '#10b981', margin: 0 }}>
                            Best: {lastLog.weight}kg x {lastLog.reps}
                        </p>
                    ) : (
                        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', margin: 0 }}>No previous records.</p>
                    )}
                </div>
                <button 
                    onClick={onSave}
                    className="btn-secondary"
                    style={{ fontSize: '0.85rem', padding: '0.5rem 1rem', borderRadius: '2rem' }}
                >
                    🔚 Finish
                </button>
            </div>

            {/* Timer Section */}
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.2rem', borderRadius: '16px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ fontSize: '2.8rem', fontFamily: 'monospace', fontWeight: 'bold', marginBottom: '0.8rem', color: 'var(--color-primary-light)' }}>
                    {formatTime(seconds)}
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
                    <button
                        onClick={handleTimerToggle}
                        className={isActive ? "btn-secondary" : "btn-primary"}
                        style={{ minWidth: '110px' }}
                    >
                        {isActive ? 'Pause' : 'Start'}
                    </button>
                    <button onClick={handleTimerReset} className="btn-secondary" disabled={seconds === 0}>
                        Reset
                    </button>
                </div>
            </div>

            {/* Logging Section */}
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', background: 'rgba(255,255,255,0.05)', padding: '1.2rem', borderRadius: '16px' }}>
                <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '0.8rem', color: 'var(--color-text-dim)', display: 'block', marginBottom: '0.4rem' }}>Weight (kg)</label>
                    <input
                        type="number"
                        value={weight}
                        onChange={(e) => setWeight(e.target.value)}
                        placeholder="kg"
                        style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.4)', color: 'white', fontSize: '1rem' }}
                    />
                </div>
                <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '0.8rem', color: 'var(--color-text-dim)', display: 'block', marginBottom: '0.4rem' }}>Reps</label>
                    <input
                        type="number"
                        value={reps}
                        onChange={(e) => setReps(e.target.value)}
                        placeholder="reps"
                        style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.4)', color: 'white', fontSize: '1rem' }}
                    />
                </div>
                <button
                    onClick={handleSaveLog}
                    className="btn-primary"
                    style={{ height: '48px', padding: '0 1.5rem', whiteSpace: 'nowrap', borderRadius: '8px', fontWeight: 'bold' }}
                >
                    Save Set
                </button>
            </div>

            {/* Session Summary Table */}
            {sessionSets.length > 0 && (
                <div style={{ marginTop: '0.5rem' }} className="fade-in">
                    <h5 style={{ fontSize: '0.9rem', marginBottom: '0.6rem', color: 'var(--color-text-dim)', fontWeight: '600' }}>SESSION HISTORY</h5>
                    <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                        {sessionSets.map((set, idx) => (
                            <div key={idx} style={{ 
                                display: 'flex', 
                                justifyContent: 'space-between', 
                                alignItems: 'center',
                                padding: '0.8rem 1.2rem',
                                borderBottom: idx === sessionSets.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.05)',
                                fontSize: '0.95rem'
                            }}>
                                <span style={{ color: 'var(--color-primary-light)', fontWeight: 'bold', width: '60px' }}>SET {idx + 1}</span>
                                <span style={{ flex: 1, textAlign: 'center', fontWeight: '500' }}>{set.weight}kg × {set.reps} reps</span>
                                <span style={{ color: 'var(--color-text-dim)', fontSize: '0.85rem', width: '60px', textAlign: 'right' }}>{set.time}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default EquipmentTimer;
