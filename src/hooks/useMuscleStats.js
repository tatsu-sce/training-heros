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

    // Fetch stats on mount
    useEffect(() => {
        if (!user) return;

        const fetchStats = async () => {
            try {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('avatar_stats, display_name')
                    .eq('id', user.id)
                    .single();

                if (error) {
                    console.error('Error fetching muscle stats:', error);
                } else if (data) {
                    if (data.avatar_stats) setStats(data.avatar_stats);
                    setProfile({ display_name: data.display_name });
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
                .update({ avatar_stats: newStats })
                .eq('id', user.id);

            if (error) {
                console.error('Error updating muscle stats:', error);
                // Revert on error (optional, but good practice)
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
    };

    return { stats, profile, loading, trainMuscle };
};
