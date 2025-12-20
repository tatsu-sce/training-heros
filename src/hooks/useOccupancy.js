import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export const useOccupancy = () => {
    const [occupancy, setOccupancy] = useState(0);
    const [maxCapacity] = useState(120); // Capacity
    const [loading, setLoading] = useState(true);

    const fetchOccupancy = async () => {
        try {
            const threshold = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();

            const { count, error } = await supabase
                .from('profiles')
                .select('*', { count: 'exact', head: true })
                .eq('is_present', true)
                .gt('last_check_in_at', threshold);

            if (error) throw error;
            setOccupancy(count || 0);
        } catch (err) {
            console.error('Error fetching occupancy:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOccupancy();

        // Realtime subscription for updates
        const channel = supabase
            .channel('public:profiles:occupancy')
            .on('postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'profiles' },
                () => {
                    fetchOccupancy();
                }
            )
            .subscribe();

        // Periodic refresh every 5 minutes to handle stale sessions 
        // that haven't triggered a DB update
        const interval = setInterval(fetchOccupancy, 5 * 60 * 1000);

        return () => {
            supabase.removeChannel(channel);
            clearInterval(interval);
        };
    }, []);

    const percentage = Math.round((occupancy / maxCapacity) * 100);

    // 5-level status based on absolute user counts
    let status = 'empty';
    if (occupancy === 1) status = 'quiet';
    else if (occupancy >= 2 && occupancy <= 3) status = 'moderate';
    else if (occupancy === 4) status = 'busy';
    else if (occupancy >= 5) status = 'crowded';

    return { occupancy, maxCapacity, percentage, status, loading };
};
