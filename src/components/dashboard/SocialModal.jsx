import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import Modal from '../ui/Modal';
import ProfileModal from './ProfileModal';

const SocialModal = ({ isOpen, onClose }) => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('friends');
    const [friends, setFriends] = useState([]);
    const [requests, setRequests] = useState([]);
    const [searchId, setSearchId] = useState('');
    const [loading, setLoading] = useState(false);
    const [selectedFriend, setSelectedFriend] = useState(null);
    const [isProfileOpen, setIsProfileOpen] = useState(false);

    const [username, setUsername] = useState(''); // repurposing this state to hold student_id for display
    const [newGroupName, setNewGroupName] = useState('');
    const [groups, setGroups] = useState([]);

    useEffect(() => {
        if (isOpen && user) {
            fetchFriends();
            fetchRequests();
            fetchGroups();
            fetchMyProfile();
        }
    }, [isOpen, user]);

    const fetchMyProfile = async () => {
        const { data } = await supabase.from('profiles').select('student_id').eq('id', user.id).single();
        if (data && data.student_id) {
            setUsername(data.student_id);
        }
    };

    const fetchFriends = async () => {
        try {
            const { data: relations, error } = await supabase
                .from('friends')
                .select('friend_id')
                .eq('user_id', user.id)
                .eq('status', 'accepted');

            if (error) throw error;
            if (relations.length === 0) {
                setFriends([]);
                return;
            }

            const friendIds = relations.map(r => r.friend_id);
            const { data: profiles, error: pError } = await supabase
                .from('profiles')
                .select('*')
                .in('id', friendIds);

            if (pError) throw pError;
            console.log('Fetched friends:', profiles.length);
            setFriends(profiles);
        } catch (err) {
            console.error('Error fetching friends:', err);
        }
    };

    const fetchRequests = async () => {
        try {
            // Fetch requests where current user is the target (friend_id)
            const { data: relations, error } = await supabase
                .from('friends')
                .select('user_id')
                .eq('friend_id', user.id)
                .eq('status', 'pending');

            if (error) throw error;
            if (relations.length === 0) {
                setRequests([]);
                return;
            }

            const requesterIds = relations.map(r => r.user_id);
            const { data: profiles, error: pError } = await supabase
                .from('profiles')
                .select('*')
                .in('id', requesterIds);

            if (pError) throw pError;
            setRequests(profiles);
        } catch (err) {
            console.error('Error fetching requests:', err);
        }
    };

    const addFriend = async () => {
        if (!searchId) return;
        setLoading(true);
        try {
            let { data: target, error: fError } = await supabase
                .from('profiles')
                .select('id')
                .eq('student_id', searchId)
                .single();

            if (!target) {
                alert('User not found. Please check the Student ID.');
                return;
            }

            if (target.id === user.id) {
                alert("You cannot add yourself.");
                return;
            }

            // Insert friendship as pending
            const { error } = await supabase
                .from('friends')
                .insert([{ user_id: user.id, friend_id: target.id, status: 'pending' }]);

            if (error) throw error;

            alert('リクエストを送信しました');
            setSearchId('');
        } catch (err) {
            console.error('Error adding friend:', err);
            alert('Failed to add friend. Already added?');
        } finally {
            setLoading(false);
        }
    };

    const acceptFriend = async (requesterId) => {
        setLoading(true);
        try {
            // 1. Update requester -> me as 'accepted'
            const { error: e1 } = await supabase
                .from('friends')
                .update({ status: 'accepted' })
                .eq('user_id', requesterId)
                .eq('friend_id', user.id);

            if (e1) throw e1;

            // 2. Insert/Upsert me -> requester as 'accepted'
            const { error: e2 } = await supabase
                .from('friends')
                .upsert([{ user_id: user.id, friend_id: requesterId, status: 'accepted' }]);

            if (e2) throw e2;

            alert('フレンドを承認しました');
            fetchFriends();
            fetchRequests();
        } catch (err) {
            console.error('Error accepting friend:', err);
            alert('承認に失敗しました');
        } finally {
            setLoading(false);
        }
    };

    const rejectFriend = async (requesterId) => {
        setLoading(true);
        try {
            const { error } = await supabase
                .from('friends')
                .delete()
                .eq('user_id', requesterId)
                .eq('friend_id', user.id);

            if (error) throw error;
            fetchRequests();
        } catch (err) {
            console.error('Error rejecting friend:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchGroups = async () => {
        try {
            const { data, error } = await supabase
                .from('groups')
                .select('*')
                .order('created_at', { ascending: false });
            if (error) throw error;
            setGroups(data);
        } catch (err) {
            console.error(err);
        }
    };

    const removeFriend = async (friendId) => {
        try {
            console.log('Attempting to delete friend:', friendId);

            const { data: d1, error: e1 } = await supabase
                .from('friends')
                .delete()
                .eq('user_id', user.id)
                .eq('friend_id', friendId)
                .select();

            if (e1) throw e1;

            const { data: d2, error: e2 } = await supabase
                .from('friends')
                .delete()
                .eq('user_id', friendId)
                .eq('friend_id', user.id)
                .select();

            if (e2) throw e2;

            if (d1.length === 0 && d2.length === 0) {
                alert('削除に失敗しました（権限エラーの可能性があります）');
            } else {
                alert('フレンドを削除しました');
            }

            fetchFriends();
            if (activeTab === 'requests') fetchRequests();
        } catch (err) {
            console.error('Error removing friend:', err);
            alert('削除に失敗しました');
        }
    };

    const createGroup = async () => {
        if (!newGroupName) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('groups')
                .insert([{ name: newGroupName, owner_id: user.id }])
                .select()
                .single();

            if (error) throw error;

            // Add self as member
            await supabase.from('group_members').insert([{ group_id: data.id, user_id: user.id }]);

            alert('Group created!');
            setNewGroupName('');
            fetchGroups();
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Social & Friends">
            <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.1)', marginBottom: '1.5rem' }}>
                <button
                    onClick={() => setActiveTab('friends')}
                    style={{
                        padding: '0.8rem 1.5rem',
                        background: 'none',
                        border: 'none',
                        borderBottom: activeTab === 'friends' ? '2px solid var(--color-primary)' : 'none',
                        color: activeTab === 'friends' ? 'white' : 'var(--color-text-muted)',
                        cursor: 'pointer'
                    }}
                >
                    Friends
                </button>
                <button
                    onClick={() => setActiveTab('requests')}
                    style={{
                        padding: '0.8rem 1.5rem',
                        background: 'none',
                        border: 'none',
                        borderBottom: activeTab === 'requests' ? '2px solid var(--color-primary)' : 'none',
                        color: activeTab === 'requests' ? 'white' : 'var(--color-text-muted)',
                        cursor: 'pointer',
                        position: 'relative'
                    }}
                >
                    Requests
                    {requests.length > 0 && (
                        <span style={{
                            position: 'absolute', top: '0.5rem', right: '0.2rem',
                            background: 'var(--color-primary)', color: 'white',
                            borderRadius: '50%', width: '16px', height: '16px',
                            fontSize: '0.6rem', display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                            {requests.length}
                        </span>
                    )}
                </button>
                <button
                    onClick={() => setActiveTab('groups')}
                    style={{
                        padding: '0.8rem 1.5rem',
                        background: 'none',
                        border: 'none',
                        borderBottom: activeTab === 'groups' ? '2px solid var(--color-primary)' : 'none',
                        color: activeTab === 'groups' ? 'white' : 'var(--color-text-muted)',
                        cursor: 'pointer'
                    }}
                >
                    Groups
                </button>
            </div>

            {activeTab === 'friends' && (
                <div>
                    <div style={{ marginBottom: '2rem', padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                        <p style={{ fontSize: '0.8rem', color: 'var(--color-text-dim)', marginBottom: '0.5rem' }}>Your Student ID:</p>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <code style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--color-primary)' }}>
                                {username || "Loading..."}
                            </code>
                        </div>
                        <p style={{ fontSize: '0.7rem', color: 'gray', marginTop: '0.4rem' }}>
                            ※ Share this ID with friends so they can add you.
                        </p>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem' }}>
                        <input
                            type="text"
                            placeholder="Enter Friend's Student ID"
                            value={searchId}
                            onChange={(e) => setSearchId(e.target.value)}
                            style={{
                                flex: 1,
                                padding: '0.8rem',
                                borderRadius: 'var(--radius-sm)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                background: 'rgba(0,0,0,0.2)',
                                color: 'white'
                            }}
                        />
                        <button className="btn-primary" onClick={addFriend} disabled={loading}>
                            Find & Add
                        </button>
                    </div>

                    <h4 style={{ marginBottom: '1rem', color: 'var(--color-text-muted)' }}>My Friends</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                        {friends.map(friend => (
                            <div
                                key={friend.id}
                                onClick={() => {
                                    setSelectedFriend(friend);
                                    setIsProfileOpen(true);
                                }}
                                style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-sm)',
                                    cursor: 'pointer', transition: 'background 0.2s'
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <div style={{ width: '40px', height: '40px', background: '#333', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        {friend.student_id?.charAt(0) || '?'}
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: '600' }}>{friend.student_id || 'Unknown'}</div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    {friend.is_present && (
                                        <div style={{ width: '10px', height: '10px', background: '#4ade80', borderRadius: '50%', boxShadow: '0 0 8px #4ade80' }} title="In Gym" />
                                    )}
                                    <span style={{ fontSize: '0.8rem', color: friend.is_present ? '#4ade80' : 'var(--color-text-muted)' }}>
                                        {friend.is_present ? 'In Gym' : 'Offline'}
                                    </span>
                                </div>
                            </div>
                        ))}
                        {friends.length === 0 && <p style={{ color: 'var(--color-text-muted)' }}>No friends yet. Add someone!</p>}
                    </div>

                    {selectedFriend && (
                        <ProfileModal
                            isOpen={isProfileOpen}
                            onClose={() => setIsProfileOpen(false)}
                            profile={selectedFriend}
                            isFriendProfile={true}
                            onRemoveFriend={removeFriend}
                        />
                    )}
                </div>
            )}

            {activeTab === 'requests' && (
                <div>
                    <h4 style={{ marginBottom: '1rem', color: 'var(--color-text-muted)' }}>Incoming Requests</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                        {requests.map(req => (
                            <div key={req.id} style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-sm)'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <div style={{ width: '40px', height: '40px', background: '#333', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        {req.student_id?.charAt(0) || '?'}
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: '600' }}>{req.student_id}</div>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--color-text-dim)' }}>wants to be friends</div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button
                                        onClick={() => acceptFriend(req.id)}
                                        style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem', borderRadius: '4px', background: 'var(--color-primary)', color: 'white', border: 'none', cursor: 'pointer' }}
                                        disabled={loading}
                                    >
                                        Approve
                                    </button>
                                    <button
                                        onClick={() => rejectFriend(req.id)}
                                        style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem', borderRadius: '4px', background: 'rgba(255,255,255,0.1)', color: 'white', border: 'none', cursor: 'pointer' }}
                                        disabled={loading}
                                    >
                                        Reject
                                    </button>
                                </div>
                            </div>
                        ))}
                        {requests.length === 0 && <p style={{ color: 'var(--color-text-muted)' }}>No pending requests.</p>}
                    </div>
                </div>
            )}

            {activeTab === 'groups' && (
                <div>
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem' }}>
                        <input
                            type="text"
                            placeholder="New Group Name"
                            value={newGroupName}
                            onChange={(e) => setNewGroupName(e.target.value)}
                            style={{
                                flex: 1,
                                padding: '0.8rem',
                                borderRadius: 'var(--radius-sm)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                background: 'rgba(0,0,0,0.2)',
                                color: 'white'
                            }}
                        />
                        <button className="btn-primary" onClick={createGroup} disabled={loading}>
                            Create
                        </button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '1rem' }}>
                        {groups.map(group => (
                            <div key={group.id} style={{
                                padding: '1rem',
                                background: 'rgba(99, 102, 241, 0.1)',
                                border: '1px solid rgba(99, 102, 241, 0.3)',
                                borderRadius: 'var(--radius-sm)',
                                textAlign: 'center'
                            }}>
                                <div style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>{group.name}</div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-dim)' }}>Tap to view</div>
                            </div>
                        ))}
                        {groups.length === 0 && <p style={{ color: 'var(--color-text-muted)' }}>No groups found.</p>}
                    </div>
                </div>
            )}
        </Modal>
    );
};

export default SocialModal;
