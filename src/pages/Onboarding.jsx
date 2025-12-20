
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import ScheduleEditor from '../components/dashboard/ScheduleEditor';

const Onboarding = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);

    // Form States
    const [nickname, setNickname] = useState('');
    const [mainCampus, setMainCampus] = useState('ookayama'); // Default
    const [fitnessGoal, setFitnessGoal] = useState('General Fitness');
    const [height, setHeight] = useState('');
    const [weight, setWeight] = useState('');

    const handleComplete = async () => {
        if (!user) return;
        setLoading(true);

        try {
            // Calculate initial Estimation
            const h = parseFloat(height) || 170;
            const w = parseFloat(weight) || 60;
            const bmi = w / ((h / 100) * (h / 100));

            // Rough estimation for initial avatar state
            let initialBodyFat = 15;
            if (bmi > 25) initialBodyFat = 25;
            else if (bmi < 18.5) initialBodyFat = 10;

            const updates = {
                id: user.id,
                display_name: nickname,
                main_campus: mainCampus, // Save main campus
                fitness_goal: fitnessGoal,
                height: h,
                weight: w,
                body_fat: initialBodyFat,
                last_workout_at: new Date(),
                // updated_at removed
            };

            const { error } = await supabase
                .from('profiles')
                .upsert(updates);

            if (error) throw error;

            // Force reload to ensure Dashboard fetches fresh profile data
            window.location.href = '/';
        } catch (error) {
            console.error('Error updating profile:', error);
            alert(`Failed to save profile: ${error.message || 'Unknown error'}`);
        } finally {
            setLoading(false);
        }
    };

    const isStepStatsValid = height && weight && !isNaN(height) && !isNaN(weight);

    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-bg-deep)', padding: '1rem' }}>
            <div className="glass-panel" style={{ width: '100%', maxWidth: '500px', padding: '2rem' }}>
                <h1 className="gradient-text" style={{ textAlign: 'center', marginBottom: '0.5rem' }}>Welcome to UniFit</h1>
                <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', marginBottom: '2rem' }}>Let's set up your profile</p>

                {/* Step Indicators */}
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', justifyContent: 'center' }}>
                    {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} style={{
                            width: '30px', height: '4px', borderRadius: '2px',
                            background: step >= i ? 'var(--color-primary)' : 'rgba(255,255,255,0.1)'
                        }} />
                    ))}
                </div>

                {/* Step 1: Nickname */}
                {step === 1 && (
                    <div className="fade-in">
                        <label style={{ display: 'block', marginBottom: '1rem' }}>
                            <span style={{ color: 'var(--color-text-dim)', fontSize: '0.9rem' }}>What should we call you?</span>
                            <input
                                type="text"
                                value={nickname}
                                onChange={(e) => setNickname(e.target.value)}
                                placeholder="Enter your nickname"
                                style={{
                                    width: '100%', padding: '1rem', marginTop: '0.5rem',
                                    background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '8px', color: 'white', fontSize: '1.1rem'
                                }}
                            />
                        </label>
                        <button
                            className="btn-primary"
                            style={{ width: '100%', marginTop: '1rem' }}
                            disabled={!nickname.trim()}
                            onClick={() => setStep(2)}
                        >
                            Next
                        </button>
                    </div>
                )}

                {/* Step 2: Main Campus */}
                {step === 2 && (
                    <div className="fade-in">
                        <div style={{ marginBottom: '1.5rem' }}>
                            <span style={{ color: 'var(--color-text-dim)', fontSize: '0.9rem', display: 'block', marginBottom: '0.5rem' }}>Select your Main Campus</span>
                            <div style={{ display: 'grid', gap: '0.8rem' }}>
                                {[
                                    { id: 'ookayama', label: 'Ookayama (大岡山)' },
                                    { id: 'suzukakedai', label: 'Suzukakedai (すずかけ台)' }
                                ].map(campus => (
                                    <button
                                        key={campus.id}
                                        onClick={() => setMainCampus(campus.id)}
                                        style={{
                                            padding: '1.2rem',
                                            textAlign: 'left',
                                            background: mainCampus === campus.id ? 'rgba(99, 102, 241, 0.2)' : 'rgba(0,0,0,0.2)',
                                            border: mainCampus === campus.id ? '1px solid var(--color-primary)' : '1px solid rgba(255,255,255,0.1)',
                                            borderRadius: '12px',
                                            color: mainCampus === campus.id ? 'white' : 'var(--color-text-muted)',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center'
                                        }}
                                    >
                                        <span style={{ fontWeight: '600', fontSize: '1rem' }}>{campus.label}</span>
                                        {mainCampus === campus.id && <span style={{ color: 'var(--color-primary)' }}>● Selected</span>}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setStep(1)}>Back</button>
                            <button className="btn-primary" style={{ flex: 1 }} onClick={() => setStep(3)}>Next</button>
                        </div>
                    </div>
                )}

                {/* Step 3: Goal */}
                {step === 3 && (
                    <div className="fade-in">
                        <div style={{ marginBottom: '1.5rem' }}>
                            <span style={{ color: 'var(--color-text-dim)', fontSize: '0.9rem', display: 'block', marginBottom: '0.5rem' }}>What is your main goal?</span>
                            <div style={{ display: 'grid', gap: '0.5rem' }}>
                                {['Diet / Weight Loss', 'Muscle Gain', 'Strength / Power', 'General Health', 'Athlete Performance'].map(goal => (
                                    <button
                                        key={goal}
                                        onClick={() => setFitnessGoal(goal)}
                                        style={{
                                            padding: '1rem',
                                            textAlign: 'left',
                                            background: fitnessGoal === goal ? 'rgba(16, 185, 129, 0.2)' : 'rgba(0,0,0,0.2)',
                                            border: fitnessGoal === goal ? '1px solid var(--color-primary)' : '1px solid rgba(255,255,255,0.1)',
                                            borderRadius: '8px',
                                            color: fitnessGoal === goal ? 'var(--color-primary)' : 'white',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        {goal}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setStep(2)}>Back</button>
                            <button className="btn-primary" style={{ flex: 1 }} onClick={() => setStep(4)}>Next</button>
                        </div>
                    </div>
                )}

                {/* Step 4: Height & Weight */}
                {step === 4 && (
                    <div className="fade-in">
                        <div style={{ marginBottom: '1.5rem' }}>
                            <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Body Stats</h3>
                            <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>
                                This info helps us generate your initial avatar.
                            </p>

                            <label style={{ display: 'block', marginBottom: '1rem' }}>
                                <span style={{ color: 'var(--color-text-dim)', fontSize: '0.9rem' }}>Height (cm) ~ Approx.</span>
                                <input
                                    type="number"
                                    value={height}
                                    onChange={(e) => setHeight(e.target.value)}
                                    placeholder="e.g. 170"
                                    style={{
                                        width: '100%', padding: '0.8rem', marginTop: '0.5rem',
                                        background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '8px', color: 'white'
                                    }}
                                />
                            </label>

                            <label style={{ display: 'block', marginBottom: '1rem' }}>
                                <span style={{ color: 'var(--color-text-dim)', fontSize: '0.9rem' }}>Weight (kg) ~ Approx.</span>
                                <input
                                    type="number"
                                    value={weight}
                                    onChange={(e) => setWeight(e.target.value)}
                                    placeholder="e.g. 60"
                                    style={{
                                        width: '100%', padding: '0.8rem', marginTop: '0.5rem',
                                        background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '8px', color: 'white'
                                    }}
                                />
                            </label>
                        </div>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setStep(3)}>Back</button>
                            <button
                                className="btn-primary"
                                style={{ flex: 1 }}
                                onClick={() => setStep(5)}
                                disabled={!isStepStatsValid}
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 5: Class Schedule */}
                {step === 5 && (
                    <div className="fade-in">
                        <div style={{ marginBottom: '1.5rem' }}>
                            <span style={{ color: 'var(--color-text-dim)', fontSize: '0.9rem', display: 'block', marginBottom: '0.5rem' }}>Set your Class Schedule (Tap Available Slots)</span>
                            <div style={{ maxHeight: '350px', overflowY: 'auto', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', background: 'rgba(0,0,0,0.2)' }}>
                                <ScheduleEditor />
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setStep(4)}>Back</button>
                            <button
                                className="btn-primary"
                                style={{ flex: 1 }}
                                onClick={handleComplete}
                                disabled={loading}
                            >
                                {loading ? 'Saving...' : 'Finish Setup'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Onboarding;
