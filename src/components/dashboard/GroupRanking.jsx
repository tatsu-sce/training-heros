import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';

const GroupRanking = ({ groupId }) => {
    const { user } = useAuth();
    const [ranking, setRanking] = useState([]);
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState(30); // Default 30 days

    useEffect(() => {
        if (groupId) {
            fetchRanking();
        }
    }, [groupId, period]);

    const fetchRanking = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase.rpc('get_group_ranking', { 
                group_id_param: groupId, 
                period_days: period 
            });

            if (error) throw error;
            setRanking(data || []);
        } catch (err) {
            console.error('Error fetching ranking:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ marginTop: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h4 style={{ margin: 0 }}>Leaderboard (Kcal)</h4>
                <select 
                    value={period} 
                    onChange={(e) => setPeriod(Number(e.target.value))}
                    style={{
                        background: 'rgba(0,0,0,0.3)',
                        color: 'white',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '4px',
                        padding: '2px 8px',
                        fontSize: '0.8rem'
                    }}
                >
                    <option value={7}>Last 7 Days</option>
                    <option value={30}>Last 30 Days</option>
                    <option value={365}>All Time</option>
                </select>
            </div>

            {loading ? (
                <p style={{ fontSize: '0.9rem', color: 'var(--color-text-dim)' }}>Loading ranking...</p>
            ) : ranking.length === 0 ? (
                <p style={{ fontSize: '0.9rem', color: 'var(--color-text-dim)' }}>No activity yet.</p>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {ranking.map((item, index) => (
                        <div 
                            key={item.user_id} 
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                padding: '0.8rem',
                                background: item.user_id === user.id ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255,255,255,0.03)',
                                border: item.user_id === user.id ? '1px solid rgba(99, 102, 241, 0.5)' : 'none',
                                borderRadius: '8px'
                            }}
                        >
                            <div style={{ 
                                width: '24px', 
                                height: '24px', 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center',
                                fontWeight: 'bold',
                                color: index < 3 ? '#fbbf24' : 'var(--color-text-muted)',
                                marginRight: '1rem'
                            }}>
                                {index + 1}
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: '600', fontSize: '0.95rem' }}>
                                    {item.student_id} {item.user_id === user.id && '(You)'}
                                </div>
                            </div>
                            <div style={{ fontWeight: 'bold', color: 'var(--color-secondary)' }}>
                                {Math.round(item.total_calories).toLocaleString()} kcal
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default GroupRanking;
