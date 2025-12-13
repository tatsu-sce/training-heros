import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
const PERIODS = Array.from({ length: 10 }, (_, i) => i + 1); // 1 to 10

const ScheduleEditor = ({ onScheduleUpdate }) => {
    const { user } = useAuth();
    const [schedule, setSchedule] = useState([]); // List of occupied slots
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

        // Check if slot is currently occupied
        const existingEntry = schedule.find(s => s.day_of_week === day && s.period === period);

        // Optimistic update
        let newSchedule;
        if (existingEntry) {
            newSchedule = schedule.filter(s => !(s.day_of_week === day && s.period === period));
        } else {
            // Include dummy id or flag for optimistic adding? 
            // Better to wait for DB or just use local state carefully.
            // For now, simple optimistic approach for UI responsiveness.
            newSchedule = [...schedule, { day_of_week: day, period, is_occupied: true, optimistic: true }];
        }
        setSchedule(newSchedule);

        try {
            if (existingEntry) {
                // Delete entry (free up the slot)
                const { error } = await supabase
                    .from('user_schedules')
                    .delete()
                    .eq('id', existingEntry.id);
                if (error) throw error;
            } else {
                // Insert entry (occupy the slot)
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

    const isOccupied = (day, period) => {
        return schedule.some(s => s.day_of_week === day && s.period === period);
    };

    return (
        <div style={{ overflowX: 'auto', padding: '0.5rem' }}>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '1rem', textAlign: 'center' }}>
                Tap slots to mark them as <strong>Busy (Class)</strong>. Empty slots are free time!
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '40px repeat(5, 1fr)', gap: '4px', minWidth: '300px', maxWidth: '600px', margin: '0 auto' }}>
                {/* Header Row */}
                <div style={{}}></div>
                {DAYS.map(day => (
                    <div key={day} style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--color-text-muted)', paddingBottom: '0.5rem' }}>
                        {day}
                    </div>
                ))}

                {/* Grid Rows */}
                {PERIODS.map(period => (
                    <React.Fragment key={period}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                            {period}
                        </div>
                        {DAYS.map(day => {
                            const active = isOccupied(day, period);
                            return (
                                <button
                                    key={`${day}-${period}`}
                                    onClick={() => toggleSlot(day, period)}
                                    style={{
                                        aspectRatio: '1',
                                        borderRadius: '4px',
                                        border: 'none',
                                        background: active ? 'var(--color-primary)' : 'rgba(255,255,255,0.05)',
                                        cursor: 'pointer',
                                        transition: 'transform 0.1s',
                                        opacity: active ? 1 : 0.5
                                    }}
                                    title={`${day} Period ${period}`}
                                    onMouseEnter={(e) => e.target.style.opacity = '1'}
                                    onMouseLeave={(e) => e.target.style.opacity = active ? '1' : '0.5'}
                                />
                            );
                        })}
                    </React.Fragment>
                ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', marginTop: '1rem', fontSize: '0.8rem', color: 'var(--color-text-dim)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: '12px', height: '12px', background: 'var(--color-primary)', borderRadius: '2px' }}></div>
                    Busy
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: '12px', height: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px' }}></div>
                    Free
                </div>
            </div>
        </div>
    );
};

export default ScheduleEditor;
