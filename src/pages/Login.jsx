import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';

const Login = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { resetPasswordForEmail } = useAuth();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [studentId, setStudentId] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [showEmailSent, setShowEmailSent] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (isForgotPassword) {
        const { error } = await resetPasswordForEmail(email);
        if (error) throw error;
        setMessage('Password reset link has been sent to your email.');
        setShowEmailSent(true);
      } else if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              student_id: studentId
            }
          }
        });
        if (error) throw error;
        setShowEmailSent(true);
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        navigate('/');
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (showEmailSent) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-bg-deep)' }}>
        <div className="glass-panel" style={{ padding: '3rem', width: '100%', maxWidth: '420px', textAlign: 'center' }}>
          <div style={{ width: '60px', height: '60px', background: 'rgba(16, 185, 129, 0.2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', color: '#10b981', fontSize: '1.5rem' }}>
            ✉️
          </div>
          <h2 style={{ marginBottom: '1rem' }}>Check Your Email</h2>
          <p style={{ color: 'var(--color-text-muted)', marginBottom: '2rem' }}>
            {isForgotPassword ? "We've sent a password reset link to:" : "We've sent a confirmation link to:"}<br />
            <strong style={{ color: 'white' }}>{email}</strong>
          </p>
          <p style={{ fontSize: '0.9rem', color: 'var(--color-text-dim)', marginBottom: '2rem' }}>
            Please check your inbox (and spam folder) and click the link to {isForgotPassword ? 'reset your password' : 'verify your account'}.
          </p>
          <button
            onClick={() => {
              setShowEmailSent(false);
              setIsForgotPassword(false);
              setIsSignUp(false);
            }}
            className="btn-secondary"
            style={{ width: '100%' }}
          >
            Back to Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-bg-deep)' }}>
      {/* Background Decor */}
      <div style={{ position: 'absolute', top: '20%', left: '20%', width: '300px', height: '300px', background: 'var(--color-primary)', filter: 'blur(150px)', opacity: 0.2, borderRadius: '50%' }}></div>
      <div style={{ position: 'absolute', bottom: '20%', right: '20%', width: '250px', height: '250px', background: 'var(--color-secondary)', filter: 'blur(150px)', opacity: 0.2, borderRadius: '50%' }}></div>

      <div className="glass-panel" style={{ padding: '3rem', width: '100%', maxWidth: '420px', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <h1 className="gradient-text" style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>UniFit</h1>
          <p style={{ color: 'var(--color-text-muted)' }}>
            {isForgotPassword ? 'Reset Password' : (isSignUp ? 'Create Account' : t('welcome'))}
          </p>
        </div>

        {error && (
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--color-error)', color: 'var(--color-error)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--color-text-dim)' }}>Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{ width: '100%', padding: '0.8rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: 'white', outline: 'none', transition: 'border-color 0.2s' }}
              placeholder="student@university.edu"
              onFocus={(e) => e.target.style.borderColor = 'var(--color-primary)'}
              onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
            />
          </div>

          {isSignUp && !isForgotPassword && (
            <div className="fade-in">
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--color-text-dim)' }}>Student ID</label>
              <input
                type="text"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                required={isSignUp}
                style={{ width: '100%', padding: '0.8rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: 'white', outline: 'none', transition: 'border-color 0.2s' }}
                placeholder="e.g. 2024A001"
                onFocus={(e) => e.target.style.borderColor = 'var(--color-primary)'}
                onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
              />
            </div>
          )}

          {!isForgotPassword && (
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--color-text-dim)' }}>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{ width: '100%', padding: '0.8rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: 'white', outline: 'none', transition: 'border-color 0.2s' }}
                placeholder="••••••••"
                onFocus={(e) => e.target.style.borderColor = 'var(--color-primary)'}
                onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
              />
            </div>
          )}

          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
            style={{ marginTop: '1rem', justifyContent: 'center', opacity: loading ? 0.7 : 1 }}
          >
            {loading ? 'Processing...' : (isForgotPassword ? 'Send Reset Link' : (isSignUp ? 'Sign Up' : 'Sign In'))}
          </button>
        </form>

        {!isForgotPassword && (
          <div style={{ textAlign: 'center', marginTop: '1rem' }}>
            <button
              onClick={() => {
                setIsForgotPassword(true);
                setIsSignUp(false);
                setError(null);
              }}
              style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', textDecoration: 'underline' }}
            >
              Forgot Password?
            </button>
          </div>
        )}

        <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.9rem', color: 'var(--color-text-dim)' }}>
          {isForgotPassword ? (
            <button
              onClick={() => {
                setIsForgotPassword(false);
                setError(null);
              }}
              style={{ color: 'var(--color-primary)', fontWeight: '600', textDecoration: 'underline', textUnderlineOffset: '4px' }}
            >
              Back to Sign In
            </button>
          ) : (
            <>
              {isSignUp ? "Already have an account?" : "Don't have an account?"}
              <button
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setIsForgotPassword(false);
                  setError(null);
                }}
                style={{ color: 'var(--color-primary)', marginLeft: '0.5rem', fontWeight: '600', textDecoration: 'underline', textUnderlineOffset: '4px' }}
              >
                {isSignUp ? 'Sign In' : 'Sign Up'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
