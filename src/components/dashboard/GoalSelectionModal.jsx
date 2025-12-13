import React, { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import Modal from '../ui/Modal';

const GOALS = [
    { id: 'Diet', label: 'Diet / Weight Loss', desc: 'Burn fat and get lean' },
    { id: 'Hypertrophy', label: 'Muscle Gain / Hypertrophy', desc: 'Build size and volume' },
    { id: 'Strength', label: 'Strength / Power', desc: 'Lift heavier weights' },
    { id: 'Health', label: 'General Health', desc: 'Stay active and healthy' }
];

const GoalSelectionModal = ({ isOpen, onClose, currentGoal, onUpdate }) => {
    const { user } = useAuth();
    const [selected, setSelected] = useState(currentGoal || 'Health');
    const [loading, setLoading] = useState(false);

    const handleSave = async () => {
        setLoading(true);
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ fitness_goal: selected })
                .eq('id', user.id);

            if (error) throw error;

            if (onUpdate) onUpdate(selected);
            onClose();
        } catch (err) {
            console.error(err);
            alert('Failed to update goal.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Select Your Goal">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                {GOALS.map(goal => (
                    <div
                        key={goal.id}
                        onClick={() => setSelected(goal.id)}
                        style={{
                            padding: '1rem',
                            border: selected === goal.id ? '2px solid var(--color-primary)' : '1px solid rgba(255,255,255,0.1)',
                            background: selected === goal.id ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255,255,255,0.05)',
                            borderRadius: 'var(--radius-sm)',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                    >
                        <div style={{ fontWeight: 'bold', marginBottom: '0.4rem', color: selected === goal.id ? 'white' : 'var(--color-text-muted)' }}>
                            {goal.label}
                        </div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--color-text-dim)' }}>
                            {goal.desc}
                        </div>
                    </div>
                ))}
            </div>

            <button
                className="btn-primary"
                onClick={handleSave}
                disabled={loading}
                style={{ width: '100%' }}
            >
                {loading ? 'Saving...' : 'Set Goal'}
            </button>
        </Modal>
    );
};

export default GoalSelectionModal;
