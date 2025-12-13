import React from 'react';
import Modal from '../ui/Modal';

const ProfileModal = ({ isOpen, onClose, user, profile, currentGoal, mySchedule, onEditSchedule }) => {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Student Profile">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', paddingBottom: '1rem' }}>
                <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--color-text-dim)', display: 'block', marginBottom: '0.2rem' }}>Name</label>
                    <p style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>{profile?.display_name || 'N/A'}</p>
                </div>
                <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--color-text-dim)', display: 'block', marginBottom: '0.2rem' }}>Student ID</label>
                    <p style={{ fontFamily: 'monospace', background: 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: '4px', display: 'inline-block', fontSize: '0.9rem' }}>
                        {user?.id?.substring(0, 8).toUpperCase() || 'UNKNOWN'}
                    </p>
                </div>
                <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--color-text-dim)', display: 'block', marginBottom: '0.2rem' }}>Fitness Goal</label>
                    <p style={{ color: 'var(--color-primary)', fontWeight: '500' }}>{currentGoal}</p>
                </div>
                <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--color-text-dim)', display: 'block', marginBottom: '0.2rem' }}>Free Time</label>
                    <p style={{ fontSize: '0.9rem' }}>
                        {mySchedule.length > 0
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
            </div>
            <div style={{ marginTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1rem', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
                <p>Additional profile settings can be managed here in the future.</p>
            </div>
        </Modal>
    );
};

export default ProfileModal;
