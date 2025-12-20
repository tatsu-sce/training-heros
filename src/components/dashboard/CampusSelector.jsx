import React from 'react';

const CAMPUSES = [
    { id: 'ookayama', name: 'Ookayama', label: '大岡山キャンパス' },
    { id: 'suzukakedai', name: 'Suzukakedai', label: 'すずかけ台キャンパス' }
];

const CampusSelector = ({ selectedCampus, onSelect }) => {
    return (
        <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
            {CAMPUSES.map((campus) => {
                const isSelected = selectedCampus === campus.id;
                return (
                    <button
                        key={campus.id}
                        onClick={() => onSelect(campus.id)}
                        style={{
                            padding: '0.5rem 1rem',
                            borderRadius: '20px',
                            border: isSelected ? '1px solid var(--color-primary)' : '1px solid rgba(255,255,255,0.1)',
                            background: isSelected ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255,255,255,0.05)',
                            color: isSelected ? 'white' : 'var(--color-text-dim)',
                            fontSize: '0.8rem',
                            fontWeight: isSelected ? '600' : 'normal',
                            whiteSpace: 'nowrap',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            boxShadow: isSelected ? '0 0 10px rgba(99, 102, 241, 0.2)' : 'none'
                        }}
                    >
                        {campus.label}
                    </button>
                );
            })}
        </div>
    );
};

export default CampusSelector;
