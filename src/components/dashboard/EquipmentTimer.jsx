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

    const isCardio = equipment?.category === 'cardio';

    // Auto-select if equipment prop provided
    useEffect(() => {
        if (equipment) {
            setSelectedId(equipment.id);
        }
    }, [equipment]);

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
    }, [user, selectedId, equipment, isCardio]);

    const handleSaveLog = async () => {
        if (!user || !selectedId || !equipment) return;
        
        if (isCardio) {
            if (!distance) {
                alert("Please enter distance.");
                return;
            }
        } else {
            if (!weight || !reps) {
                alert("Please enter both Weight and Reps.");
                return;
            }
        }

        try {
            if (editingIdx !== null) {
                // Update existing log
                const setToUpdate = sessionSets[editingIdx];
                const updateData = isCardio 
                    ? { distance_km: parseFloat(distance) }
                    : { weight: parseFloat(weight), reps: parseInt(reps) };

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
                    duration_seconds: 0, // Default to 0 as timer is removed
                    ...(isCardio 
                        ? { distance_km: parseFloat(distance) }
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
                    distance_km: data.distance_km 
                }]);
            }
            
            setWeight('');
            setReps('');
            setDistance('');

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
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', background: 'rgba(255,255,255,0.05)', padding: '1.2rem', borderRadius: '16px' }}>
                {isCardio ? (
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
                <button
                    onClick={handleSaveLog}
                    className="btn-primary"
                    style={{ height: '52px', padding: '0 1.5rem', whiteSpace: 'nowrap', borderRadius: '8px', fontWeight: 'bold' }}
                >
                    {editingIdx !== null ? 'Update' : 'Save'}
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
                                fontSize: '1rem',
                                background: editingIdx === idx ? 'rgba(99, 102, 241, 0.1)' : 'transparent'
                            }}>
                                <span style={{ color: 'var(--color-primary-light)', fontWeight: 'bold', width: '50px' }}>#{idx + 1}</span>
                                <span style={{ flex: 1, textAlign: 'left', fontWeight: '500', paddingLeft: '1rem' }}>
                                    {isCardio ? `${set.distance_km}km` : `${set.weight}kg × ${set.reps} reps`}
                                </span>
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
