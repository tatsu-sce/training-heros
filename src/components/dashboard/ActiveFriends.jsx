import React from 'react';
import { useFriends } from '../../hooks/useFriends';

const getTimeAgo = (dateString) => {
    if (!dateString) return 'Last seen recently';
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} mins ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    return date.toLocaleDateString();
};

const ActiveFriends = ({ onOpenSocial }) => {
    const { friends, loading } = useFriends();

    // Filter to show active friends first, or just list a few
    const displayFriends = friends.slice(0, 5); // Show top 5

    return (
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1.1rem', color: 'var(--color-text-muted)' }}>Active Friends</h3>
                <button
                    onClick={onOpenSocial}
                    style={{ fontSize: '0.8rem', color: 'var(--color-primary)', cursor: 'pointer' }}
                >
                    View All
                </button>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', color: 'var(--color-text-dim)', fontSize: '0.8rem' }}>Loading...</div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                    {displayFriends.length > 0 ? (
                        displayFriends.map(friend => (
                            <div key={friend.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem', borderRadius: '8px', background: 'rgba(255,255,255,0.02)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                                    <div style={{ width: '32px', height: '32px', background: '#334155', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 'bold' }}>
                                        {friend.display_name?.charAt(0) || '?'}
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.9rem', fontWeight: '500' }}>{friend.display_name}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-dim)' }}>
                                            {friend.is_present
                                                ? (friend.current_location 
                                                    ? <span style={{ color: 'var(--color-primary-light)' }}>@ {friend.current_location.charAt(0).toUpperCase() + friend.current_location.slice(1)}</span>
                                                    : 'Working out now')
                                                : `Last seen ${getTimeAgo(friend.last_check_in_at)}`}
                                        </div>
                                    </div>
                                </div>
                                {friend.is_present && (
                                    <div style={{ width: '8px', height: '8px', background: '#4ade80', borderRadius: '50%', boxShadow: '0 0 8px #4ade80' }} />
                                )}
                            </div>
                        ))
                    ) : (
                        <p style={{ fontSize: '0.8rem', color: 'var(--color-text-dim)', textAlign: 'center', padding: '1rem' }}>
                            No active friends right now.
                        </p>
                    )}
                </div>
            )}
        </div>
    );
};

export default ActiveFriends;
