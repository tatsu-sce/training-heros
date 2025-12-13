import React, { useState } from 'react';

const HamburgerMenu = ({ onWorkout, onProfile, onSocial, onSupport, onQR, onSignOut }) => {
    const [isOpen, setIsOpen] = useState(false);

    const toggleMenu = () => setIsOpen(!isOpen);

    const MenuItem = ({ label, onClick, danger }) => (
        <button
            onClick={() => { onClick(); setIsOpen(false); }}
            style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                padding: '0.8rem 1rem',
                color: danger ? 'var(--color-error)' : 'white',
                background: 'transparent',
                borderBottom: '1px solid rgba(255,255,255,0.05)',
                fontSize: '0.9rem',
                cursor: 'pointer',
                transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.05)'}
            onMouseLeave={(e) => e.target.style.background = 'transparent'}
        >
            {label}
        </button>
    );

    return (
        <div style={{ position: 'relative' }}>
            <button
                onClick={toggleMenu}
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    gap: '4px',
                    width: '32px',
                    height: '32px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '0'
                }}
            >
                <span style={{ width: '100%', height: '2px', background: 'white', borderRadius: '2px' }} />
                <span style={{ width: '100%', height: '2px', background: 'white', borderRadius: '2px' }} />
                <span style={{ width: '100%', height: '2px', background: 'white', borderRadius: '2px' }} />
            </button>

            {isOpen && (
                <>
                    <div
                        style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 100 }}
                        onClick={() => setIsOpen(false)}
                    />
                    <div className="glass-panel" style={{
                        position: 'absolute',
                        top: '40px',
                        left: '0',
                        width: '200px',
                        zIndex: 101,
                        padding: '0.5rem 0',
                        overflow: 'hidden',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
                        border: '1px solid rgba(255,255,255,0.1)'
                    }}>
                        <MenuItem label="Workout Session" onClick={onWorkout} />
                        <MenuItem label="QR Code" onClick={onQR} />
                        <MenuItem label="Profile" onClick={onProfile} />
                        <MenuItem label="Social & Friends" onClick={onSocial} />
                        <MenuItem label="Support / Inquiry" onClick={onSupport} />
                        <MenuItem label="Sign Out" onClick={onSignOut} danger />
                    </div>
                </>
            )}
        </div>
    );
};

export default HamburgerMenu;
