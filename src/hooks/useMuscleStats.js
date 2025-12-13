import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';

export const useMuscleStats = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState({
        chest: 1,
        arms: 1,
        legs: 1,
        abs: 1,
        shoulders: 1,
        back: 1
    });
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    const [bodyStats, setBodyStats] = useState({ height: 170, bodyFat: 15 }); // New state for body stats

    // Fetch stats on mount
    useEffect(() => {
        if (!user) return;

        const fetchStats = async () => {
            try {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('avatar_stats, display_name, height, weight, body_fat, last_workout_at, fitness_goal')
                    .eq('id', user.id)
                    .single();

                if (error) {
                    console.error('Error fetching muscle stats:', error);
                } else if (data) {
                    let currentStats = data.avatar_stats || stats;
                    let currentBodyFat = data.body_fat || 15;

                    // Check Activity Decay
                    if (data.last_workout_at) {
                        const lastWorkout = new Date(data.last_workout_at);
                        const now = new Date();
                        const diffTime = Math.abs(now - lastWorkout);
                        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

                        if (diffDays > 3) {
                            console.log(`User inactive for ${diffDays} days. Applying decay.`);
                            let changed = false;

                            // Logic based on goal
                            if (data.fitness_goal === 'Muscle Gain' || data.fitness_goal === 'Strength / Power') {
                                // Decrease muscle
                                const decay = 0.02 * (diffDays - 3); // Small decay per day
                                Object.keys(currentStats).forEach(key => {
                                    if (currentStats[key] > 1) {
                                        currentStats[key] = Math.max(1, currentStats[key] - decay);
                                        changed = true;
                                    }
                                });
                            } else if (data.fitness_goal === 'Diet / Weight Loss') {
                                // Increase fat
                                const fatGain = 0.2 * (diffDays - 3);
                                currentBodyFat = Math.min(40, currentBodyFat + fatGain);
                                changed = true;
                            }

                            if (changed) {
                                // Save applied decay
                                supabase.from('profiles').update({
                                    avatar_stats: currentStats,
                                    body_fat: currentBodyFat
                                }).eq('id', user.id).then(res => {
                                    if (res.error) console.error("Decay update failed", res.error);
                                });
                            }
                        }
                    }

                    setStats(currentStats);
                    setBodyStats({ height: data.height || 170, bodyFat: currentBodyFat });
                    setProfile({ display_name: data.display_name, fitness_goal: data.fitness_goal });
                }
            } catch (err) {
                console.error('Unexpected error fetching stats:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, [user]);

    // Function to update stats
    const updateStats = async (newStats) => {
        // Optimistic update
        setStats(newStats);

        if (!user) return;

        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    avatar_stats: newStats,
                    last_workout_at: new Date() // Update last workout time
                })
                .eq('id', user.id);

            if (error) {
                console.error('Error updating muscle stats:', error);
            }
        } catch (err) {
            console.error('Unexpected error updating stats:', err);
        }
    };

    const trainMuscle = (part) => {
        const newStats = {
            ...stats,
            [part]: (stats[part] || 1) + 0.1 // Increment by 0.1 for smoother growth
        };
        updateStats(newStats);

        // Also reduce fat slightly if training?
        // Let's keep it simple for now, goal impact is enough.
    };

    return { stats, bodyStats, profile, loading, trainMuscle };
};
