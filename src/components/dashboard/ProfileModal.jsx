import React from 'react';
import Modal from '../ui/Modal';

const ProfileModal = ({ isOpen, onClose, user, profile, currentGoal, mySchedule, onEditSchedule, isFriendProfile, onRemoveFriend }) => {
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
                        <label style={{ fontSize: '0.8rem', color: 'var(--color-text-dim)', display: 'block', marginBottom: '0.2rem' }}>Free Time</label>
                        <p style={{ fontSize: '0.9rem' }}>
                            {mySchedule?.length > 0
                                ? `${42 - mySchedule.length} Free Slots / Week`
                                : 'All slots free'}
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
                <div style={{ marginTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1rem', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
                    <p>Additional profile settings can be managed here in the future.</p>
                </div>
            )}
        </Modal>
    );
};

export default ProfileModal;
