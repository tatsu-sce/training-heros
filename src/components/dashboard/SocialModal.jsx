import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import Modal from '../ui/Modal';

const SocialModal = ({ isOpen, onClose }) => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('friends');
    const [friends, setFriends] = useState([]);
    const [groups, setGroups] = useState([]);
    const [searchId, setSearchId] = useState('');
    const [newGroupName, setNewGroupName] = useState('');
    const [loading, setLoading] = useState(false);

    const [username, setUsername] = useState(''); // repurposing this state to hold student_id for display
    // Removed isEditingId, newIdInput as manual setting is deprecated

    useEffect(() => {
        if (isOpen && user) {
            fetchFriends();
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
    // Removed saveUsername

    // --- Friends Logic ---
    const fetchFriends = async () => {
        try {
            const { data: relations, error } = await supabase
                .from('friends')
                .select('friend_id')
                .eq('user_id', user.id);

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
            setFriends(profiles);
        } catch (err) {
            console.error('Error fetching friends:', err);
        }
    };

    const addFriend = async () => {
        if (!searchId) return;
        setLoading(true);
        try {
            // Search by student_id
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

            // Insert friendship
            const { error } = await supabase
                .from('friends')
                .insert([{ user_id: user.id, friend_id: target.id, status: 'accepted' }]);

            if (error) throw error;

            alert('Friend added!');
            setSearchId('');
            fetchFriends();
        } catch (err) {
            console.error('Error adding friend:', err);
            alert('Failed to add friend. Already added?');
        } finally {
            setLoading(false);
        }
    };

    // --- Groups Logic ---
    const fetchGroups = async () => {
        // Fetch groups where user is a member
        // Detailed Logic: member -> group_id -> group details
        // For simple demo, we fetch all groups for now so we can see them easily
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
                    {/* Your ID Display */}
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

                    {/* Add Friend */}
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
                            <div key={friend.id} style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-sm)'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    {/* Avatar Placeholder */}
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
