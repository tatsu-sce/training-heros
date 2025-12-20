import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const PERIODS = Array.from({ length: 16 }, (_, i) => i + 1); // 1 to 16 (10:00 to 18:00)
const TIME_LABELS = {
    1: '10:00-10:30', 2: '10:30-11:00', 3: '11:00-11:30', 4: '11:30-12:00',
    5: '12:00-12:30', 6: '12:30-13:00', 7: '13:00-13:30', 8: '13:30-14:00',
    9: '14:00-14:30', 10: '14:30-15:00', 11: '15:00-15:30', 12: '15:30-16:00',
    13: '16:00-16:30', 14: '16:30-17:00', 15: '17:00-17:30', 16: '17:30-18:00'
};

const ScheduleEditor = ({ onScheduleUpdate }) => {
    const { user } = useAuth();
    const [schedule, setSchedule] = useState([]); // List of available slots
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (user) {
            fetchSchedule();
        }
    }, [user]);

    const fetchSchedule = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('user_schedules')
                .select('*')
                .eq('user_id', user.id);

            if (error) throw error;
            setSchedule(data || []);
        } catch (error) {
            console.error('Error fetching schedule:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleSlot = async (day, period) => {
        if (!user) return;

        // Check if slot is currently marked as free
        const existingEntry = schedule.find(s => s.day_of_week === day && s.period === period);

        // Optimistic update
        let newSchedule;
        if (existingEntry) {
            newSchedule = schedule.filter(s => !(s.day_of_week === day && s.period === period));
        } else {
            newSchedule = [...schedule, { day_of_week: day, period, is_occupied: true, optimistic: true }];
        }
        setSchedule(newSchedule);

        try {
            if (existingEntry) {
                // Remove free time slot
                const { error } = await supabase
                    .from('user_schedules')
                    .delete()
                    .eq('id', existingEntry.id);
                if (error) throw error;
            } else {
                // Mark slot as free time
                const { data, error } = await supabase
                    .from('user_schedules')
                    .insert([{ user_id: user.id, day_of_week: day, period, is_occupied: true }])
                    .select()
                    .single();

                if (error) throw error;
                // Update state with actual ID from DB
                setSchedule(prev => prev.map(s => (s.day_of_week === day && s.period === period && s.optimistic) ? data : s));
            }
            if (onScheduleUpdate) onScheduleUpdate(); // Notify parent
        } catch (error) {
            console.error('Error updating schedule:', error);
            fetchSchedule(); // Revert on error
        }
    };

    const isAvailable = (day, period) => {
        return schedule.some(s => s.day_of_week === day && s.period === period);
    };

    return (
        <div style={{ overflowX: 'auto', padding: '0.5rem' }}>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '1rem', textAlign: 'center' }}>
                トレーニングに行ける<strong>空き時間</strong>をタップして選択してください。
            </p>

            <div style={{
                display: 'grid',
                gridTemplateColumns: '85px repeat(6, 1fr)',
                gap: '6px',
                minWidth: '550px',
                maxWidth: '850px',
                margin: '0 auto',
                maxHeight: '400px',
                overflowY: 'auto',
                paddingRight: '4px'
            }}>
                {/* Header Row */}
                <div style={{}}></div>
                {DAYS.map(day => (
                    <div key={day} style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--color-text-muted)', paddingBottom: '0.5rem', fontWeight: 'bold' }}>
                        {day}
                    </div>
                ))}

                {/* Grid Rows */}
                {PERIODS.map(period => (
                    <React.Fragment key={period}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', color: 'var(--color-text-muted)', fontWeight: '500' }}>
                            {TIME_LABELS[period]}
                        </div>
                        {DAYS.map(day => {
                            const active = isAvailable(day, period);
                            return (
                                <button
                                    key={`${day}-${period}`}
                                    onClick={() => toggleSlot(day, period)}
                                    style={{
                                        aspectRatio: '1',
                                        borderRadius: '6px',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        background: active ? 'var(--color-primary)' : 'rgba(255,255,255,0.03)',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                        boxShadow: active ? '0 0 10px rgba(139, 92, 246, 0.3)' : 'none'
                                    }}
                                    title={`${day} ${TIME_LABELS[period]}`}
                                    onMouseEnter={(e) => {
                                        e.target.style.transform = 'scale(1.1)';
                                        e.target.style.zIndex = '1';
                                        if (!active) e.target.style.background = 'rgba(255,255,255,0.1)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.target.style.transform = 'scale(1)';
                                        e.target.style.zIndex = '0';
                                        if (!active) e.target.style.background = 'rgba(255,255,255,0.03)';
                                    }}
                                />
                            );
                        })}
                    </React.Fragment>
                ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', marginTop: '1.5rem', fontSize: '0.8rem', color: 'var(--color-text-dim)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: '12px', height: '12px', background: 'var(--color-primary)', borderRadius: '3px' }}></div>
                    空き時間 (Available)
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: '12px', height: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '3px' }}></div>
                    予定あり (Busy)
                </div>
            </div>
        </div>
    );
};

export default ScheduleEditor;
