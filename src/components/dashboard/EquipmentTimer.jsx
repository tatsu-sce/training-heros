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
    const [selectedEquipment, setSelectedEquipment] = useState(null); // Objects { id, name }
    const [isRunning, setIsRunning] = useState(false);
    const [seconds, setSeconds] = useState(0);
    const intervalRef = useRef(null);

    useEffect(() => {
        return () => clearInterval(intervalRef.current);
    }, []);

    const toggleTimer = async () => {
        if (!selectedEquipment) return;

        if (isRunning) {
            // Stop logic
            clearInterval(intervalRef.current);
            setIsRunning(false);

            // Log to DB
            try {
                const { error } = await supabase
                    .from('equipment_logs')
                    .insert([{
                        user_id: user.id,
                        equipment_name: selectedEquipment.name,
                        duration_seconds: seconds
                    }]);
                if (error) throw error;
                alert(`Finished using ${selectedEquipment.name}. Time logged: ${formatTime(seconds)}`);
            } catch (err) {
                console.error('Error logging equipment usage:', err);
            }

            setSeconds(0);
            setSelectedEquipment(null);
        } else {
            // Start logic
            setIsRunning(true);
            intervalRef.current = setInterval(() => {
                setSeconds(prev => prev + 1);
            }, 1000);
        }
    };

    const formatTime = (totalSeconds) => {
        const m = Math.floor(totalSeconds / 60);
        const s = totalSeconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    return (
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span>🏋️</span> Equipment Timer
            </h3>

            {!isRunning ? (
                <div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '0.8rem', marginBottom: '1.5rem' }}>
                        {EQUIPMENT_LIST.map(eq => (
                            <div
                                key={eq.id}
                                onClick={() => setSelectedEquipment(eq)}
                                style={{
                                    position: 'relative',
                                    borderRadius: '8px',
                                    overflow: 'hidden',
                                    cursor: 'pointer',
                                    border: selectedEquipment?.id === eq.id ? '2px solid var(--color-primary)' : '2px solid transparent',
                                    opacity: selectedEquipment && selectedEquipment.id !== eq.id ? 0.5 : 1,
                                    transition: 'all 0.2s'
                                }}
                            >
                                <img
                                    src={eq.image}
                                    alt={eq.name}
                                    style={{ width: '100%', height: '80px', objectFit: 'cover' }}
                                />
                                <div style={{
                                    position: 'absolute', bottom: 0, left: 0, width: '100%',
                                    background: 'rgba(0,0,0,0.7)', padding: '4px', fontSize: '0.7rem',
                                    textAlign: 'center', color: 'white'
                                }}>
                                    {eq.name}
                                </div>
                            </div>
                        ))}
                    </div>

                    <button
                        className="btn-primary"
                        disabled={!selectedEquipment}
                        onClick={toggleTimer}
                        style={{ width: '100%', opacity: !selectedEquipment ? 0.5 : 1 }}
                    >
                        {selectedEquipment ? `Start Using ${selectedEquipment.name}` : 'Select Equipment to Start'}
                    </button>
                </div>
            ) : (
                <div style={{ textAlign: 'center' }}>
                    <div style={{ marginBottom: '1rem' }}>
                        <img
                            src={selectedEquipment.image}
                            alt={selectedEquipment.name}
                            style={{ width: '120px', height: '120px', borderRadius: '50%', objectFit: 'cover', border: '4px solid var(--color-primary)' }}
                        />
                    </div>
                    <p style={{ color: 'var(--color-text-muted)', fontWeight: 'bold', marginBottom: '0.2rem' }}>
                        Using: <span style={{ color: 'white' }}>{selectedEquipment.name}</span>
                    </p>
                    <div style={{ fontSize: '3.5rem', fontFamily: 'monospace', fontWeight: 'bold', margin: '0.5rem 0', textShadow: '0 0 20px rgba(99, 102, 241, 0.5)' }}>
                        {formatTime(seconds)}
                    </div>
                    <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden', marginBottom: '2rem' }}>
                        <div style={{
                            width: '100%',
                            height: '100%',
                            background: 'linear-gradient(90deg, var(--color-primary), #ec4899)',
                            animation: 'pulse 2s infinite'
                        }} />
                    </div>
                    <button
                        onClick={toggleTimer}
                        style={{
                            background: 'rgba(239, 68, 68, 0.2)',
                            color: '#fca5a5',
                            border: '1px solid #ef4444',
                            padding: '0.8rem 2rem',
                            borderRadius: 'var(--radius-md)',
                            cursor: 'pointer',
                            fontSize: '1rem',
                            fontWeight: '600',
                            width: '100%',
                            transition: 'all 0.2s'
                        }}
                    >
                        Finish & Log
                    </button>
                    <style>{`
                        @keyframes pulse {
                            0% { opacity: 0.6; transform: translateX(-100%); }
                            50% { opacity: 1; transform: translateX(0%); }
                            100% { opacity: 0.6; transform: translateX(100%); }
                        }
                    `}</style>
                </div>
            )}
        </div>
    );
};

export default EquipmentTimer;
