import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';

const GroupMemberManagement = ({ group, isOwner, onClose, onRefresh }) => {
    const { user } = useAuth();
    const [members, setMembers] = useState([]);
    const [requests, setRequests] = useState([]); // pending_member
    const [loading, setLoading] = useState(false);
    const [inviteId, setInviteId] = useState('');

    useEffect(() => {
        fetchMemberships();
    }, [group]);

    const fetchMemberships = async () => {
        try {
            // Fetch Members (active)
            const { data: activeData, error: mError } = await supabase
                .from('group_members')
                .select('user_id, status, profiles:user_id(student_id)')
                .eq('group_id', group.id)
                .eq('status', 'active');

            if (mError) throw mError;
            setMembers(activeData || []);

            // Fetch Requests (pending_member) - Only if owner
            if (isOwner) {
                const { data: reqData, error: rError } = await supabase
                    .from('group_members')
                    .select('user_id, status, profiles:user_id(student_id)')
                    .eq('group_id', group.id)
                    .eq('status', 'pending_member');

                if (rError) throw rError;
                setRequests(reqData || []);
            }

        } catch (err) {
            console.error('Error fetching members:', err);
        }
    };

    const handleInvite = async () => {
        if (!inviteId) return;
        setLoading(true);
        try {
            // Find user by student_id
            const { data: targetUser, error: uError } = await supabase
                .from('profiles')
                .select('id')
                .eq('student_id', inviteId)
                .single();

            if (uError || !targetUser) {
                alert('User not found.');
                return;
            }

            // Check if already member
            const { data: existing } = await supabase
                .from('group_members')
                .select('status')
                .eq('group_id', group.id)
                .eq('user_id', targetUser.id)
                .single();

            if (existing) {
                alert(`User is already ${existing.status}.`);
                return;
            }

            // Insert 'invited' status
            const { error: iError } = await supabase
                .from('group_members')
                .insert([{
                    group_id: group.id,
                    user_id: targetUser.id,
                    status: 'invited'
                }]);

            if (iError) throw iError;

            alert('Invitation sent!');
            setInviteId('');
        } catch (err) {
            console.error('Error inviting:', err);
            alert('Failed to invite.');
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (userId) => {
        try {
            const { error } = await supabase
                .from('group_members')
                .update({ status: 'active' })
                .eq('group_id', group.id)
                .eq('user_id', userId);

            if (error) throw error;
            fetchMemberships();
        } catch (err) {
            console.error('Error approving:', err);
        }
    };

    const handleReject = async (userId) => {
        try {
            const { error } = await supabase
                .from('group_members')
                .delete()
                .eq('group_id', group.id)
                .eq('user_id', userId);

            if (error) throw error;
            fetchMemberships();
        } catch (err) {
            console.error('Error rejecting:', err);
        }
    };

    const handleLeave = async () => {
        if (!confirm('Are you sure you want to leave this group?')) return;
        try {
            const { error } = await supabase
                .from('group_members')
                .delete()
                .eq('group_id', group.id)
                .eq('user_id', user.id);

            if (error) throw error;
            onClose(); // Close modal/view
            onRefresh(); // Refresh parent list
        } catch (err) {
            console.error('Error leaving group:', err);
        }
    };

    return (
        <div style={{ marginTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1rem' }}>
            <h4 style={{ marginBottom: '1rem' }}>Members ({members.length})</h4>

            <div style={{ maxHeight: '150px', overflowY: 'auto', marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {members.map(m => (
                    <div key={m.user_id} style={{ fontSize: '0.9rem', padding: '0.5rem', background: 'rgba(255,255,255,0.03)', borderRadius: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>
                            {m.profiles?.student_id || 'Unknown'} {m.user_id === group.owner_id && '👑'}
                        </span>
                        {isOwner && m.user_id !== group.owner_id && (
                            <button
                                onClick={async () => {
                                    if (!confirm(`Remove ${m.profiles?.student_id}?`)) return;
                                    try {
                                        const { error } = await supabase.from('group_members').delete().eq('group_id', group.id).eq('user_id', m.user_id);
                                        if (error) throw error;
                                        fetchMemberships();
                                    } catch (err) {
                                        console.error(err);
                                        alert('Failed to remove member');
                                    }
                                }}
                                style={{
                                    background: 'rgba(239, 68, 68, 0.2)',
                                    color: '#ef4444',
                                    border: 'none',
                                    borderRadius: '4px',
                                    padding: '2px 8px',
                                    fontSize: '0.7rem',
                                    cursor: 'pointer'
                                }}
                            >
                                Remove
                            </button>
                        )}
                    </div>
                ))}
            </div>

            {isOwner && (
                <>
                    <h5 style={{ color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>Invite User</h5>
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
                        <input
                            type="text"
                            placeholder="Student ID"
                            value={inviteId}
                            onChange={(e) => setInviteId(e.target.value)}
                            style={{ flex: 1, padding: '0.5rem', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.1)', background: 'black', color: 'white' }}
                        />
                        <button onClick={handleInvite} disabled={loading} style={{ padding: '0.5rem 1rem', background: 'var(--color-primary)', border: 'none', borderRadius: '4px', color: 'white', cursor: 'pointer' }}>
                            Invite
                        </button>
                    </div>

                    {requests.length > 0 && (
                        <>
                            <h5 style={{ color: '#fbbf24', marginBottom: '0.5rem' }}>Join Requests ({requests.length})</h5>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
                                {requests.map(req => (
                                    <div key={req.user_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem', background: 'rgba(251, 191, 36, 0.1)', borderRadius: '4px' }}>
                                        <span>{req.profiles?.student_id}</span>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <button onClick={() => handleApprove(req.user_id)} style={{ padding: '2px 8px', background: '#34d399', border: 'none', borderRadius: '3px', cursor: 'pointer' }}>✓</button>
                                            <button onClick={() => handleReject(req.user_id)} style={{ padding: '2px 8px', background: '#f87171', border: 'none', borderRadius: '3px', cursor: 'pointer' }}>✕</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </>
            )}

            {!isOwner && (
                <button
                    onClick={handleLeave}
                    style={{
                        width: '100%',
                        padding: '0.8rem',
                        background: 'rgba(248, 113, 113, 0.1)',
                        color: '#f87171',
                        border: '1px solid rgba(248, 113, 113, 0.3)',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        marginTop: '1rem'
                    }}
                >
                    Leave Group
                </button>
            )}
        </div>
    );
};

export default GroupMemberManagement;
