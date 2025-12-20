import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';

export const useFriends = () => {
    const { user } = useAuth();
    const [friends, setFriends] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (user) {
            fetchFriends();
            // Optional: Subscribe to realtime changes for friend status
            const subscription = supabase
                .channel('public:occupancy_logs') // Listening to occupancy logs to update 'present' status?
                .on('postgres_changes', { event: '*', schema: 'public', table: 'occupancy_logs' }, () => {
                    fetchFriends(); // Refresh on check-in/out
                })
                .subscribe();

            return () => {
                supabase.removeChannel(subscription);
            };
        }
    }, [user]);

    const fetchFriends = async () => {
        setLoading(true);
        try {
            const { data: relations, error } = await supabase
                .from('friends')
                .select('friend_id')
                .eq('user_id', user.id)
                .eq('status', 'accepted');

            if (error) throw error;
            if (!relations || relations.length === 0) {
                setFriends([]);
                return;
            }

            const friendIds = relations.map(r => r.friend_id);
            const { data: profiles, error: pError } = await supabase
                .from('profiles')
                .select('*')
                .in('id', friendIds);

            if (pError) throw pError;

            // In a real app, we'd check their latest occupancy status. 
            // For now, let's assume is_present is stored in profile or calculated.
            // But wait, the original SocialModal logic seemed to imply is_present property exists on profile or was mocked.
            // Let's verify if 'is_present' is on profile. If not, we might need to join with real-time occupancy.
            // For this implementation, I will just return profiles. The Dashboard can mock presence or we add a quick check.

            // The `profiles` table already has the correct `is_present` status (maintained by handle_occupancy RPC).
            // So we can just use the data from the profiles table directly.
            const enrichedFriends = profiles;

            setFriends(enrichedFriends);
        } catch (err) {
            console.error('Error fetching friends:', err);
        } finally {
            setLoading(false);
        }
    };

    return { friends, loading, refreshFriends: fetchFriends };
};
