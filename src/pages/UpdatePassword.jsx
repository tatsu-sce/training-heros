import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const UpdatePassword = () => {
    const { updatePassword, user } = useAuth();
    const navigate = useNavigate();
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);
    const [error, setError] = useState(null);

    if (!user) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-bg-deep)' }}>
                <div className="glass-panel" style={{ padding: '3rem', width: '100%', maxWidth: '420px', textAlign: 'center' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
                    <h2 style={{ marginBottom: '1rem' }}>Link Expired or Invalid</h2>
                    <p style={{ color: 'var(--color-text-muted)', marginBottom: '2rem' }}>
                        We couldn't verify your session. This usually happens if:
                    </p>
                    <ul style={{ textAlign: 'left', color: 'var(--color-text-dim)', marginBottom: '2rem', fontSize: '0.9rem', lineHeight: '1.6' }}>
                        <li>The password reset link has expired</li>
                        <li>You visited this page directly without clicking the email link</li>
                        <li>The link was already used</li>
                    </ul>
                    <button
                        onClick={() => navigate('/login')}
                        className="btn-primary"
                        style={{ width: '100%' }}
                    >
                        Return to Login
                    </button>
                </div>
            </div>
        );
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setMessage(null);

        try {
            const { error } = await updatePassword(password);
            if (error) throw error;
            setMessage('Password has been updated successfully.');
            setTimeout(() => {
                navigate('/');
            }, 2000);
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-bg-deep)' }}>
            <div className="glass-panel" style={{ padding: '3rem', width: '100%', maxWidth: '420px', zIndex: 1 }}>
                <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                    <h1 style={{ fontSize: '1.8rem', marginBottom: '0.5rem', color: 'white' }}>Update Password</h1>
                    <p style={{ color: 'var(--color-text-muted)' }}>Enter your new password below.</p>
                </div>

                {error && (
                    <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--color-error)', color: 'var(--color-error)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                        {error}
                    </div>
                )}

                {message && (
                    <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid var(--color-success)', color: 'var(--color-success)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                        {message}
                    </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--color-text-dim)' }}>New Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength={6}
                            style={{ width: '100%', padding: '0.8rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: 'white', outline: 'none', transition: 'border-color 0.2s' }}
                            placeholder="New password"
                            onFocus={(e) => e.target.style.borderColor = 'var(--color-primary)'}
                            onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn-primary"
                        disabled={loading}
                        style={{ marginTop: '1rem', justifyContent: 'center', opacity: loading ? 0.7 : 1 }}
                    >
                        {loading ? 'Updating...' : 'Update Password'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default UpdatePassword;
