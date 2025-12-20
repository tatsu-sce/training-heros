import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export const useOccupancy = () => {
    const [counts, setCounts] = useState({ total: 0, ookayama: 0, suzukakedai: 0 });
    const [maxCapacity] = useState(120);
    const [loading, setLoading] = useState(true);

    const fetchOccupancy = async () => {
        try {
            const threshold = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();

            const { data, error } = await supabase
                .from('profiles')
                .select('main_campus')
                .eq('is_present', true)
                .gt('last_check_in_at', threshold);

            if (error) throw error;

            const newCounts = { total: 0, ookayama: 0, suzukakedai: 0 };
            if (data) {
                newCounts.total = data.length;
                data.forEach(p => {
                    const campus = p.main_campus || 'ookayama'; // Default to ookayama if null
                    if (newCounts[campus] !== undefined) {
                        newCounts[campus]++;
                    } else {
                        // Handle unexpected campus IDs
                        newCounts[campus] = (newCounts[campus] || 0) + 1;
                    }
                });
            }
            setCounts(newCounts);
        } catch (err) {
            console.error('Error fetching occupancy:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOccupancy();

        const channel = supabase
            .channel('public:profiles:occupancy')
            .on('postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'profiles' },
                () => fetchOccupancy()
            )
            .subscribe();

        const interval = setInterval(fetchOccupancy, 60 * 1000); // 1 min refresh

        return () => {
            supabase.removeChannel(channel);
            clearInterval(interval);
        };
    }, []);

    // Helper to get status for specific count
    const getStatus = (count) => {
        if (count == 0) return 'empty'; // Fixed: use == 0
        if (count === 1) return 'quiet';
        if (count >= 2 && count <= 3) return 'moderate';
        if (count === 4) return 'busy';
        return 'crowded';
    };

    return { counts, maxCapacity, getStatus, loading };
};
