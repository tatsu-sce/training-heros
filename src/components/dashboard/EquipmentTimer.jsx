import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';

const EQUIPMENT_LIST = [
    { id: 'bench1', name: 'ベンチプレス', image: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400&q=80' },
    { id: 'rack1', name: 'スクワットラック', image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&q=80' },
    { id: 'platform1', name: 'デッドリフト台', image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400&q=80' },
    { id: 'dumbbells', name: 'ダンベルエリア', image: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=400&q=80' },
    { id: 'cable', name: 'ケーブルマシン', image: 'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=400&q=80' },
    { id: 'treadmill', name: 'ランニングマシン', image: 'https://images.unsplash.com/photo-1576678927484-cc907957088c?w=400&q=80' }
];

const EquipmentTimer = () => {
    const { user } = useAuth();
    const [selectedId, setSelectedId] = useState(null);
    const [seconds, setSeconds] = useState(0);
    const [isActive, setIsActive] = useState(false);

    // Recording States
    const [weight, setWeight] = useState('');
    const [reps, setReps] = useState('');
    const [lastLog, setLastLog] = useState(null);

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

        const equipment = EQUIPMENT_LIST.find(e => e.id === selectedId);
        if (!equipment) return;

        const fetchLastLog = async () => {
            const { data } = await supabase
                .from('equipment_logs')
                .select('weight, reps, created_at')
                .eq('user_id', user.id)
                .eq('equipment_name', equipment.name)
                .not('weight', 'is', null)
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle(); // Use maybeSingle to avoid error if no rows

            if (data) setLastLog(data);
            else setLastLog(null);
        };

        fetchLastLog();
        // Reset inputs
        setWeight('');
        setReps('');
    }, [user, selectedId]);

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

        const equipment = EQUIPMENT_LIST.find(e => e.id === selectedId);

        try {
            const { error } = await supabase
                .from('equipment_logs')
                .insert({
                    user_id: user.id,
                    equipment_name: equipment.name,
                    duration_seconds: seconds, // Log timer time too if running
                    weight: parseFloat(weight),
                    reps: parseInt(reps)
                });

            if (error) throw error;

            alert("Record Saved!");

            // Update last log immediately
            setLastLog({
                weight: weight,
                reps: reps,
                created_at: new Date().toISOString()
            });

            // Optional: Clear inputs? User might want to log same set again.
            // setWeight('');
            // setReps('');

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

    return (
        <div className="glass-panel" style={{ padding: '1.5rem', width: '100%' }}>
            <h3 style={{ marginBottom: '1.5rem', fontSize: '1.2rem', color: 'var(--color-primary-light)' }}>Equipment Timer & Log</h3>

            {!selectedId ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '1rem' }}>
                    {EQUIPMENT_LIST.map((item) => (
                        <div
                            key={item.id}
                            onClick={() => setSelectedId(item.id)}
                            className="card-hover"
                            style={{
                                cursor: 'pointer',
                                borderRadius: '12px',
                                overflow: 'hidden',
                                border: '1px solid rgba(255,255,255,0.1)',
                                position: 'relative'
                            }}
                        >
                            <img
                                src={item.image}
                                alt={item.name}
                                style={{ width: '100%', height: '100px', objectFit: 'cover' }}
                            />
                            <div style={{ padding: '0.8rem', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', position: 'absolute', bottom: 0, width: '100%' }}>
                                <span style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>{item.name}</span>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="fade-in">
                    <button
                        onClick={() => { setSelectedId(null); handleTimerReset(); }}
                        style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', marginBottom: '1rem', cursor: 'pointer' }}
                    >
                        ← Back to List
                    </button>

                    {(() => {
                        const item = EQUIPMENT_LIST.find(e => e.id === selectedId);
                        return (
                            <div style={{ display: 'flex', gap: '1.5rem', flexDirection: 'column' }}>
                                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                    <img src={item.image} alt={item.name} style={{ width: '80px', height: '80px', borderRadius: '8px', objectFit: 'cover' }} />
                                    <div>
                                        <h4 style={{ fontSize: '1.1rem' }}>{item.name}</h4>
                                        {lastLog ? (
                                            <p style={{ fontSize: '0.85rem', color: '#10b981' }}>
                                                Last: {lastLog.weight}kg x {lastLog.reps} ({new Date(lastLog.created_at).toLocaleDateString()})
                                            </p>
                                        ) : (
                                            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>No previous records.</p>
                                        )}
                                    </div>
                                </div>

                                {/* Timer Section */}
                                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '12px', textAlign: 'center' }}>
                                    <div style={{ fontSize: '2.5rem', fontFamily: 'monospace', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                                        {formatTime(seconds)}
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
                                        <button
                                            onClick={handleTimerToggle}
                                            className={isActive ? "btn-secondary" : "btn-primary"}
                                            style={{ minWidth: '100px' }}
                                        >
                                            {isActive ? 'Pause' : 'Start'}
                                        </button>
                                        <button onClick={handleTimerReset} className="btn-secondary" disabled={seconds === 0}>
                                            Reset
                                        </button>
                                    </div>
                                </div>

                                {/* Logging Section */}
                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end', background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '12px' }}>
                                    <div style={{ flex: 1 }}>
                                        <label style={{ fontSize: '0.8rem', color: 'var(--color-text-dim)', display: 'block', marginBottom: '0.3rem' }}>Weight (kg)</label>
                                        <input
                                            type="number"
                                            value={weight}
                                            onChange={(e) => setWeight(e.target.value)}
                                            placeholder="kg"
                                            style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.3)', color: 'white' }}
                                        />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <label style={{ fontSize: '0.8rem', color: 'var(--color-text-dim)', display: 'block', marginBottom: '0.3rem' }}>Reps</label>
                                        <input
                                            type="number"
                                            value={reps}
                                            onChange={(e) => setReps(e.target.value)}
                                            placeholder="reps"
                                            style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.3)', color: 'white' }}
                                        />
                                    </div>
                                    <button
                                        onClick={handleSaveLog}
                                        className="btn-primary"
                                        style={{ height: '38px', whiteSpace: 'nowrap' }}
                                    >
                                        Save Set
                                    </button>
                                </div>
                            </div>
                        );
                    })()}
                </div>
            )}
        </div>
    );
};

export default EquipmentTimer;
