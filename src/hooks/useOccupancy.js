import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export const useOccupancy = () => {
    const [occupancy, setOccupancy] = useState(0);
    const [maxCapacity] = useState(120); // Capacity
    const [loading, setLoading] = useState(true);

    const fetchOccupancy = async () => {
        try {
            const { count, error } = await supabase
                .from('profiles')
                .select('*', { count: 'exact', head: true })
                .eq('is_present', true);

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
                    fetchOccupancy(); // Re-fetch on any update (simple & robust)
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const percentage = Math.round((occupancy / maxCapacity) * 100);

    let status = 'low';
    if (percentage > 50) status = 'medium';
    if (percentage > 80) status = 'high';

    return { occupancy, maxCapacity, percentage, status, loading };
};
