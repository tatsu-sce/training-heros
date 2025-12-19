import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import Modal from '../ui/Modal';

const TIME_SLOTS = [
    { period: 1, label: '10-12', start: 10, end: 12 },
    { period: 2, label: '12-14', start: 12, end: 14 },
    { period: 3, label: '14-16', start: 14, end: 16 },
    { period: 4, label: '16-18', start: 16, end: 18 }
];

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const RecommendedTimesModal = ({ isOpen, onClose }) => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [currentOccupancy, setCurrentOccupancy] = useState(0);
    const [recommendedSlots, setRecommendedSlots] = useState([]);
    const [notificationEnabled, setNotificationEnabled] = useState(false);

    useEffect(() => {
        if (isOpen && user) {
            fetchRecommendedTimes();
        }
    }, [isOpen, user]);

    const fetchRecommendedTimes = async () => {
        try {
            setLoading(true);

            // 1. Check if user has notifications enabled
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('notification_enabled')
                .eq('id', user.id)
                .single();

            if (profileError) throw profileError;
            setNotificationEnabled(profile?.notification_enabled || false);

            if (!profile?.notification_enabled) {
                setLoading(false);
                return;
            }

            // 2. Get current occupancy (checked in users without checkout)
            const { data: occupancyData, error: occupancyError } = await supabase
                .rpc('get_current_occupancy');

            if (occupancyError) {
                console.error('Error fetching occupancy:', occupancyError);
                // Fallback: count manually
                const { data: logs, error: logsError } = await supabase
                    .from('occupancy_logs')
                    .select('user_id, action, created_at')
                    .order('created_at', { ascending: false });

                if (logsError) throw logsError;

                // Calculate current occupancy from logs
                const userStatus = {};
                logs?.forEach(log => {
                    if (!userStatus[log.user_id]) {
                        userStatus[log.user_id] = log.action === 'check_in';
                    }
                });
                const occupancy = Object.values(userStatus).filter(Boolean).length;
                setCurrentOccupancy(occupancy);
            } else {
                setCurrentOccupancy(occupancyData || 0);
            }

            // 3. Get user's available schedule
            const { data: scheduleData, error: scheduleError } = await supabase
                .from('user_schedules')
                .select('*')
                .eq('user_id', user.id)
                .eq('is_occupied', true); // true means available time

            if (scheduleError) throw scheduleError;

            // 4. Filter for current day and time
            const now = new Date();
            const currentDay = DAYS[now.getDay() === 0 ? 6 : now.getDay() - 1]; // Convert Sunday=0 to Sat, Mon=1 to Mon, etc.
            const currentHour = now.getHours();

            const recommended = scheduleData
                ?.filter(slot => {
                    // Check if it's the current day
                    if (slot.day_of_week !== currentDay) return false;

                    // Check if current time falls within this slot
                    const timeSlot = TIME_SLOTS.find(ts => ts.period === slot.period);
                    if (!timeSlot) return false;

                    return currentHour >= timeSlot.start && currentHour < timeSlot.end;
                })
                .map(slot => {
                    const timeSlot = TIME_SLOTS.find(ts => ts.period === slot.period);
                    return {
                        day: slot.day_of_week,
                        time: timeSlot?.label || `Slot ${slot.period}`
                    };
                }) || [];

            setRecommendedSlots(recommended);
        } catch (error) {
            console.error('Error fetching recommended times:', error);
        } finally {
            setLoading(false);
        }
    };

    if (!notificationEnabled) {
        return (
            <Modal isOpen={isOpen} onClose={onClose} title="Recommended Times">
                <div style={{ textAlign: 'center', padding: '2rem' }}>
                    <p style={{ color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
                        Enable notifications in your profile to see recommended times when the gym is less crowded!
                    </p>
                </div>
            </Modal>
        );
    }

    const showRecommendation = currentOccupancy <= 10 && recommendedSlots.length > 0;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Recommended Times">
            <div style={{ padding: '1rem' }}>
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '2rem' }}>
                        <p style={{ color: 'var(--color-text-muted)' }}>Loading...</p>
                    </div>
                ) : showRecommendation ? (
                    <div>
                        <div style={{
                            background: 'rgba(16, 185, 129, 0.1)',
                            border: '1px solid var(--color-primary)',
                            borderRadius: '8px',
                            padding: '1.5rem',
                            marginBottom: '1rem'
                        }}>
                            <h3 style={{ color: 'var(--color-primary)', marginBottom: '0.5rem', fontSize: '1.2rem' }}>
                                🎉 Great Time to Train!
                            </h3>
                            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem' }}>
                                The training center currently has <strong style={{ color: 'var(--color-primary)' }}>{currentOccupancy} people</strong> —
                                and you're available right now!
                            </p>
                        </div>

                        <div style={{ marginTop: '1.5rem' }}>
                            <h4 style={{ fontSize: '0.9rem', color: 'var(--color-text-dim)', marginBottom: '0.5rem' }}>
                                Your Available Slots:
                            </h4>
                            {recommendedSlots.map((slot, idx) => (
                                <div key={idx} style={{
                                    padding: '0.75rem',
                                    background: 'rgba(255,255,255,0.05)',
                                    borderRadius: '6px',
                                    marginBottom: '0.5rem'
                                }}>
                                    <span style={{ color: 'var(--color-text)' }}>
                                        {slot.day} {slot.time}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div style={{ textAlign: 'center', padding: '2rem' }}>
                        <p style={{ color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
                            {currentOccupancy > 10
                                ? `The training center currently has ${currentOccupancy} people. We'll notify you when it's less crowded during your available times!`
                                : "No matching available times right now. Check back later!"}
                        </p>
                    </div>
                )}
            </div>
        </Modal>
    );
};

export default RecommendedTimesModal;
