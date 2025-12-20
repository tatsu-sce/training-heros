import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';

const EquipmentTimer = ({ equipment, onSave }) => {
    const { user } = useAuth();
    const [selectedId, setSelectedId] = useState(equipment?.id || null);

    // Recording States
    const [weight, setWeight] = useState('');
    const [reps, setReps] = useState('');
    const [distance, setDistance] = useState('');
    const [personalBest, setPersonalBest] = useState(null);
    const [sessionSets, setSessionSets] = useState([]);
    const [editingIdx, setEditingIdx] = useState(null);
    const [userWeight, setUserWeight] = useState(60); // Default 60kg if not found

    // Timer State for Cardio
    const [timerActive, setTimerActive] = useState(false);
    const [timerSeconds, setTimerSeconds] = useState(0);
    const timerRef = React.useRef(null);

    const isCardio = equipment?.category === 'cardio';

    // Auto-select if equipment prop provided
    useEffect(() => {
        if (equipment) {
            setSelectedId(equipment.id);
        }
    }, [equipment]);

    // Fetch User Weight
    useEffect(() => {
        if (!user) return;
        const fetchWeight = async () => {
            const { data } = await supabase.from('profiles').select('weight').eq('id', user.id).single();
            if (data?.weight) setUserWeight(data.weight);
        };
        fetchWeight();
    }, [user]);

    // Timer Logic
    useEffect(() => {
        if (timerActive) {
            timerRef.current = setInterval(() => {
                setTimerSeconds(prev => prev + 1);
            }, 1000);
        } else {
            clearInterval(timerRef.current);
        }
        return () => clearInterval(timerRef.current);
    }, [timerActive]);

    const formatTime = (totalSeconds) => {
        const min = Math.floor(totalSeconds / 60);
        const sec = totalSeconds % 60;
        return `${min}:${sec.toString().padStart(2, '0')}`;
    };

    const toggleTimer = () => {
        setTimerActive(!timerActive);
    };

    const resetTimer = () => {
        setTimerActive(false);
        setTimerSeconds(0);
    };

    // Calculate Calories
    const calculateCalories = (currentReps, currentWeight, durationSec) => {
        if (!equipment?.mets) return 0;

        let kcal = 0;
        if (isCardio) {
            // Cardio Formula: Mets * weight(kg) * 1.5 * time(min) / 60
            const durationMin = durationSec / 60;
            kcal = equipment.mets * userWeight * 1.5 * durationMin / 60;
        } else {
            // Strength Formula: Mets * weight(kg) * Reps * 0.00125
            // Use 'set weight' for strength calc, not body weight? 
            // The prompt says "weight(kg)" which usually means body weight in MET formulas, 
            // BUT for lifting, load matters. 
            // Re-reading prompt: "weight(kg)*Rap(回)". 
            // This clearly implies the lifted weight for the machine.
            // Wait, standard METs formula usually uses body weight. 
            // But "weight * reps * constat" looks like volume load.
            // Let's assume 'weight' in the formula refers to the machine weight setting, 
            // OR checks if it is bodyweight exercise.
            // Actually, "Mets * 体重(kg) * Rap(回) * 0.00125". 
            // It explicitly says "体重(kg)" (Body Weight).
            // So I will use `userWeight` for both.
            kcal = equipment.mets * userWeight * currentReps * 0.00125;
        }
        return Math.floor(kcal * 10) / 10; // Round to 1 decimal
    };

    // Fetch PB when equipment changes
    useEffect(() => {
        if (!user || !selectedId || !equipment) return;

        const fetchPB = async () => {
            const query = supabase
                .from('equipment_logs')
                .select('weight, reps, distance_km')
                .eq('user_id', user.id)
                .eq('equipment_name', equipment.name);

            if (isCardio) {
                query.order('distance_km', { ascending: false });
            } else {
                query.order('weight', { ascending: false }).order('reps', { ascending: false });
            }

            const { data } = await query.limit(1).maybeSingle();

            if (data) setPersonalBest(data);
            else setPersonalBest(null);
        };

        fetchPB();
        setWeight('');
        setReps('');
        setDistance('');
        setSessionSets([]);
        setEditingIdx(null);
        resetTimer();
    }, [user, selectedId, equipment, isCardio]);

    const handleSaveLog = async () => {
        if (!user || !selectedId || !equipment) return;

        if (isCardio) {
            // For cardio, ensure timer has run or some metric is there?
            // Prompt says: "Distance" is usually what we track, but time is internal.
            // We use the timerSeconds for calculation.
        } else {
            if (!weight || !reps) {
                alert("Please enter both Weight and Reps.");
                return;
            }
        }

        try {
            const currentCalories = calculateCalories(
                parseInt(reps) || 0,
                parseFloat(weight) || 0,
                timerSeconds
            );

            if (editingIdx !== null) {
                // Update existing log
                const setToUpdate = sessionSets[editingIdx];
                const updateData = isCardio
                    ? { distance_km: parseFloat(distance || 0), duration_seconds: timerSeconds, calories: currentCalories }
                    : { weight: parseFloat(weight), reps: parseInt(reps), calories: currentCalories };

                const { error } = await supabase
                    .from('equipment_logs')
                    .update(updateData)
                    .eq('id', setToUpdate.id);

                if (error) throw error;

                const newSets = [...sessionSets];
                newSets[editingIdx] = { ...setToUpdate, ...updateData };
                setSessionSets(newSets);
                setEditingIdx(null);
            } else {
                // Insert new log
                const insertData = {
                    user_id: user.id,
                    equipment_name: equipment.name,
                    duration_seconds: isCardio ? timerSeconds : 0,
                    calories: currentCalories,
                    ...(isCardio
                        ? { distance_km: parseFloat(distance || 0) }
                        : { weight: parseFloat(weight), reps: parseInt(reps) })
                };

                const { data, error } = await supabase
                    .from('equipment_logs')
                    .insert(insertData)
                    .select()
                    .single();

                if (error) throw error;

                setSessionSets(prev => [...prev, {
                    id: data.id,
                    weight: data.weight,
                    reps: data.reps,
                    distance_km: data.distance_km,
                    calories: data.calories,
                    duration_seconds: data.duration_seconds
                }]);
            }

            // Do NOT reset cardio timer immediately if user wants to log laps? 
            // Usually we finish a session. Let's reset for now.
            if (!isCardio) {
                // Keep weight, reset reps maybe?
            } else {
                resetTimer();
                setDistance('');
            }

        } catch (err) {
            console.error(err);
            alert(`Failed to save record: ${err.message || JSON.stringify(err)}`);
        }
    };

    const handleDeleteSet = async (idx) => {
        if (!window.confirm("Delete this entry?")) return;

        const setToDelete = sessionSets[idx];
        try {
            const { error } = await supabase
                .from('equipment_logs')
                .delete()
                .eq('id', setToDelete.id);

            if (error) throw error;

            setSessionSets(sessionSets.filter((_, i) => i !== idx));
            if (editingIdx === idx) {
                setEditingIdx(null);
                setWeight('');
                setReps('');
                setDistance('');
            }
        } catch (err) {
            console.error(err);
            alert("Failed to delete entry.");
        }
    };

    const handleEditSet = (idx) => {
        const set = sessionSets[idx];
        if (isCardio) {
            setDistance(set.distance_km);
            setTimerSeconds(set.duration_seconds || 0);
        } else {
            setWeight(set.weight);
            setReps(set.reps);
        }
        setEditingIdx(idx);
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
                    {personalBest ? (
                        <p style={{ fontSize: '0.85rem', color: '#10b981', margin: 0, fontWeight: '600' }}>
                            🏆 Personal Best: {isCardio ? `${personalBest.distance_km}km` : `${personalBest.weight}kg x ${personalBest.reps}`}
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

            {/* Logging Section */}
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', background: 'rgba(255,255,255,0.05)', padding: '1.2rem', borderRadius: '16px', flexDirection: 'column' }}>
                <div style={{ display: 'flex', width: '100%', gap: '1rem', alignItems: 'flex-end' }}>
                    {isCardio ? (
                        <>
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <label style={{ fontSize: '0.8rem', color: 'var(--color-text-dim)' }}>Timer (Internal)</label>
                                <div style={{
                                    fontSize: '1.5rem',
                                    fontFamily: 'monospace',
                                    padding: '0.8rem',
                                    background: 'rgba(0,0,0,0.4)',
                                    borderRadius: '8px',
                                    textAlign: 'center',
                                    border: '1px solid rgba(255,255,255,0.1)'
                                }}>
                                    {formatTime(timerSeconds)}
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button
                                        onClick={toggleTimer}
                                        style={{
                                            flex: 1,
                                            padding: '0.6rem',
                                            borderRadius: '6px',
                                            background: timerActive ? '#ef4444' : '#10b981',
                                            color: 'white',
                                            border: 'none',
                                            fontWeight: 'bold',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        {timerActive ? 'Stop' : 'Start'}
                                    </button>
                                    <button
                                        onClick={resetTimer}
                                        style={{
                                            padding: '0.6rem 1rem',
                                            borderRadius: '6px',
                                            background: 'rgba(255,255,255,0.1)',
                                            color: 'white',
                                            border: 'none',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        Reset
                                    </button>
                                </div>
                            </div>
                            <div style={{ flex: 1 }}>
                                <label style={{ fontSize: '0.8rem', color: 'var(--color-text-dim)', display: 'block', marginBottom: '0.4rem' }}>Distance (km)</label>
                                <input
                                    type="number"
                                    inputMode="decimal"
                                    value={distance}
                                    onChange={(e) => setDistance(e.target.value)}
                                    placeholder="0.0"
                                    style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: editingIdx !== null ? '1px solid var(--color-primary)' : '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.4)', color: 'white', fontSize: '1.2rem' }}
                                />
                            </div>
                        </>
                    ) : (
                        <>
                            <div style={{ flex: 1 }}>
                                <label style={{ fontSize: '0.8rem', color: 'var(--color-text-dim)', display: 'block', marginBottom: '0.4rem' }}>Weight (kg)</label>
                                <input
                                    type="number"
                                    inputMode="decimal"
                                    value={weight}
                                    onChange={(e) => setWeight(e.target.value)}
                                    placeholder="kg"
                                    style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: editingIdx !== null ? '1px solid var(--color-primary)' : '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.4)', color: 'white', fontSize: '1.2rem' }}
                                />
                            </div>
                            <div style={{ flex: 1 }}>
                                <label style={{ fontSize: '0.8rem', color: 'var(--color-text-dim)', display: 'block', marginBottom: '0.4rem' }}>Reps</label>
                                <input
                                    type="number"
                                    inputMode="numeric"
                                    value={reps}
                                    onChange={(e) => setReps(e.target.value)}
                                    placeholder="reps"
                                    style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: editingIdx !== null ? '1px solid var(--color-primary)' : '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.4)', color: 'white', fontSize: '1.2rem' }}
                                />
                            </div>
                        </>
                    )}
                </div>

                <button
                    onClick={handleSaveLog}
                    className="btn-primary"
                    style={{ width: '100%', height: '48px', borderRadius: '8px', fontWeight: 'bold' }}
                >
                    {editingIdx !== null ? 'Update Entry' : 'Add to Log'}
                </button>
            </div>

            {/* Session Summary Table */}
            <div style={{ marginTop: '0.5rem' }} className="fade-in">
                <h5 style={{ fontSize: '0.9rem', marginBottom: '0.6rem', color: 'var(--color-text-dim)', fontWeight: '600' }}>SESSION HISTORY</h5>
                <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                    {sessionSets.length > 0 ? (
                        sessionSets.map((set, idx) => (
                            <div key={idx} style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '0.8rem 1.2rem',
                                borderBottom: idx === sessionSets.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.05)',
                                fontSize: '0.9rem',
                                background: editingIdx === idx ? 'rgba(99, 102, 241, 0.1)' : 'transparent'
                            }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                                    <span style={{ fontWeight: '500' }}>
                                        {isCardio ? `${set.distance_km}km` : `${set.weight}kg × ${set.reps} reps`}
                                    </span>
                                    {set.calories && (
                                        <span style={{ fontSize: '0.75rem', color: '#fbbf24' }}>
                                            🔥 {set.calories} kcal
                                        </span>
                                    )}
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button
                                        onClick={() => handleEditSet(idx)}
                                        style={{ background: 'none', border: 'none', color: 'var(--color-text-dim)', cursor: 'pointer', padding: '4px' }}
                                        title="Edit"
                                    >
                                        ✏️
                                    </button>
                                    <button
                                        onClick={() => handleDeleteSet(idx)}
                                        style={{ background: 'none', border: 'none', color: 'rgba(239, 68, 68, 0.7)', cursor: 'pointer', padding: '4px' }}
                                        title="Delete"
                                    >
                                        🗑️
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-dim)', fontSize: '0.9rem' }}>
                            No entries in this session.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EquipmentTimer;
