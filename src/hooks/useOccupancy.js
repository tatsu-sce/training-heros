import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export const useOccupancy = () => {
    const [occupancy, setOccupancy] = useState(0);
    const [maxCapacity] = useState(120); // 定員
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Initial fetch (Mock for now, will replace with DB fetch)
        const fetchInitialData = async () => {
            // Simulation of fetching data
            setOccupancy(42);
            setLoading(false);
        };

        fetchInitialData();

        // Realtime subscription setup
        const channel = supabase
            .channel('public:occupancy_logs')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'occupancy_logs' }, (payload) => {
                // payload.new.count などを想定
                console.log('Change received!', payload);
                // 仮の実装: 新しいログが入ったら更新するロジック
                // setOccupancy(payload.new.current_count);
            })
            .subscribe();

        // Simulation of changing data for demo purposes
        const interval = setInterval(() => {
            setOccupancy(prev => {
                const change = Math.floor(Math.random() * 3) - 1; // -1, 0, or 1
                return Math.min(Math.max(prev + change, 0), maxCapacity);
            });
        }, 5000);

        return () => {
            supabase.removeChannel(channel);
            clearInterval(interval);
        };
    }, [maxCapacity]);

    const percentage = Math.round((occupancy / maxCapacity) * 100);

    let status = 'low';
    if (percentage > 50) status = 'medium';
    if (percentage > 80) status = 'high';

    return { occupancy, maxCapacity, percentage, status, loading };
};
