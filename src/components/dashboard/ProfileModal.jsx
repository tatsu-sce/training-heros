import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import { supabase } from '../../lib/supabaseClient';

const ProfileModal = ({ isOpen, onClose, user, profile, currentGoal, mySchedule, onEditSchedule, isFriendProfile, onRemoveFriend }) => {
    const [notificationEnabled, setNotificationEnabled] = useState(false);
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
        if (profile?.notification_enabled !== undefined) {
            setNotificationEnabled(profile.notification_enabled);
        }
    }, [profile]);

    const handleToggleNotification = async () => {
        if (!user) return;
        setUpdating(true);

        try {
            const newValue = !notificationEnabled;
            const { error } = await supabase
                .from('profiles')
                .update({ notification_enabled: newValue })
                .eq('id', user.id);

            if (error) throw error;

            setNotificationEnabled(newValue);
        } catch (error) {
            console.error('Error updating notification preference:', error);
            alert(`Failed to update notification: ${error.message || 'Unknown error'}`);
        } finally {
            setUpdating(false);
        }
    };

    const handleDeleteFriend = async () => {
        if (window.confirm(`${profile?.student_id} さんをフレンドから削除しますか？`)) {
            await onRemoveFriend(profile.id);
            onClose();
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={isFriendProfile ? "Friend Profile" : "Student Profile"}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', paddingBottom: '1rem' }}>
                <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--color-text-dim)', display: 'block', marginBottom: '0.2rem' }}>Name</label>
                    <p style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>{profile?.display_name || 'N/A'}</p>
                </div>
                <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--color-text-dim)', display: 'block', marginBottom: '0.2rem' }}>Student ID</label>
                    <p style={{ fontFamily: 'monospace', background: 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: '4px', display: 'inline-block', fontSize: '0.9rem' }}>
                        {profile?.student_id || 'UNKNOWN'}
                    </p>
                </div>
                <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--color-text-dim)', display: 'block', marginBottom: '0.2rem' }}>Fitness Goal</label>
                    <p style={{ color: 'var(--color-primary)', fontWeight: '500' }}>{currentGoal || profile?.fitness_goal || 'General Fitness'}</p>
                </div>
                {!isFriendProfile && (
                    <div>
                        <label style={{ fontSize: '0.8rem', color: 'var(--color-text-dim)', display: 'block', marginBottom: '0.2rem' }}>Available Time</label>
                        <p style={{ fontSize: '0.9rem' }}>
                            {mySchedule?.length > 0
                                ? `${mySchedule.length} Available Slots`
                                : 'No slots set'}
                            <button
                                onClick={() => { onClose(); onEditSchedule(); }}
                                style={{ marginLeft: '10px', fontSize: '0.8rem', color: 'var(--color-text-muted)', background: 'none', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '4px', padding: '1px 6px', cursor: 'pointer' }}
                            >
                                Edit
                            </button>
                        </p>
                    </div>
                )}
            </div>

            {isFriendProfile ? (
                <div style={{ marginTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                        onClick={handleDeleteFriend}
                        className="btn-danger"
                        style={{
                            padding: '0.5rem 1rem',
                            fontSize: '0.85rem',
                            background: 'rgba(239, 68, 68, 0.1)',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            color: '#ef4444',
                            borderRadius: '4px',
                            cursor: 'pointer'
                        }}
                    >
                        フレンドを削除
                    </button>
                </div>
            ) : (
                <div style={{ marginTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <div>
                            <label style={{ fontSize: '1rem', fontWeight: '600', display: 'block', marginBottom: '0.3rem' }}>Notifications</label>
                            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', margin: 0 }}>
                                Get notified when gym is less crowded
                            </p>
                        </div>
                        <button
                            onClick={handleToggleNotification}
                            disabled={updating}
                            style={{
                                padding: '0.6rem 1.2rem',
                                borderRadius: '8px',
                                border: 'none',
                                background: notificationEnabled
                                    ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(16, 185, 129, 0.3) 100%)'
                                    : 'rgba(255,255,255,0.05)',
                                color: notificationEnabled ? 'var(--color-primary)' : 'var(--color-text-muted)',
                                cursor: updating ? 'not-allowed' : 'pointer',
                                fontWeight: '600',
                                fontSize: '0.9rem',
                                transition: 'all 0.2s',
                                border: `1px solid ${notificationEnabled ? 'var(--color-primary)' : 'rgba(255,255,255,0.1)'}`,
                                opacity: updating ? 0.6 : 1
                            }}
                        >
                            {updating ? 'Updating...' : (notificationEnabled ? '✓ Enabled' : 'Disabled')}
                        </button>
                    </div>
                </div>
            )}
        </Modal>
    );
};

export default ProfileModal;
