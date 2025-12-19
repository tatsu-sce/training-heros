import React, { useState } from 'react';
import equipmentData from '../../data/equipment.json';
import './EquipmentSelection.css';

const EquipmentSelection = ({ onSelect }) => {
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');

    const categories = [
        { id: 'all', name: 'すべて' },
        { id: 'machine', name: 'マシン' },
        { id: 'cardio', name: '有酸素' },
        { id: 'freeweight', name: 'フリーウエイト' }
    ];

    const filteredEquipment = equipmentData.filter(item => {
        const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
        const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            item.targetMuscles.some(muscle => muscle.includes(searchTerm));
        return matchesCategory && matchesSearch;
    });

    return (
        <div className="equipment-selection">
            <h2 className="gradient-text" style={{ fontSize: '1.8rem', marginBottom: '1.5rem', textAlign: 'center' }}>
                器具を選択
            </h2>

            {/* Search Bar */}
            <div style={{ marginBottom: '1.5rem' }}>
                <input
                    type="text"
                    placeholder="器具名または部位で検索..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{
                        width: '100%',
                        padding: '0.75rem 1rem',
                        borderRadius: '0.5rem',
                        border: '1px solid rgba(255,255,255,0.1)',
                        background: 'rgba(255,255,255,0.05)',
                        color: 'var(--color-text-main)',
                        fontSize: '1rem'
                    }}
                />
            </div>

            {/* Category Tabs */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                {categories.map(cat => (
                    <button
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat.id)}
                        style={{
                            padding: '0.5rem 1rem',
                            borderRadius: '2rem',
                            border: selectedCategory === cat.id ? '2px solid var(--color-primary)' : '1px solid rgba(255,255,255,0.2)',
                            background: selectedCategory === cat.id ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255,255,255,0.05)',
                            color: selectedCategory === cat.id ? 'var(--color-primary)' : 'var(--color-text-muted)',
                            cursor: 'pointer',
                            fontSize: '0.9rem',
                            fontWeight: selectedCategory === cat.id ? '600' : '400',
                            transition: 'all 0.2s'
                        }}
                    >
                        {cat.name}
                    </button>
                ))}
            </div>

            {/* Equipment Grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                gap: '1rem',
                maxHeight: '60vh',
                overflowY: 'auto',
                padding: '0.5rem'
            }}>
                {filteredEquipment.map(equipment => (
                    <div
                        key={equipment.id}
                        onClick={() => onSelect(equipment)}
                        className="equipment-card"
                        style={{
                            background: 'rgba(255,255,255,0.05)',
                            borderRadius: '0.75rem',
                            padding: '1rem',
                            cursor: 'pointer',
                            border: '1px solid rgba(255,255,255,0.1)',
                            transition: 'all 0.3s',
                            textAlign: 'center'
                        }}
                    >
                        {/* Equipment Image or Placeholder */}
                        <div style={{
                            width: '100%',
                            height: '140px',
                            borderRadius: '0.5rem',
                            marginBottom: '0.75rem',
                            overflow: 'hidden',
                            position: 'relative',
                            background: 'rgba(255,255,255,0.05)'
                        }}>
                            {equipment.image ? (
                                <img 
                                    src={equipment.image} 
                                    alt={equipment.name}
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'cover',
                                        transition: 'transform 0.5s'
                                    }}
                                    className="equipment-img"
                                />
                            ) : (
                                <div style={{
                                    width: '100%',
                                    height: '100%',
                                    background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(139, 92, 246, 0.2))',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '2.5rem'
                                }}>
                                    {equipment.category === 'machine' ? '🏋️' : 
                                     equipment.category === 'cardio' ? '🏃' : '⚖️'}
                                </div>
                            )}
                        </div>
                        
                        <h3 style={{
                            fontSize: '1rem',
                            fontWeight: '600',
                            marginBottom: '0.5rem',
                            color: 'var(--color-text-main)'
                        }}>
                            {equipment.name}
                        </h3>
                        
                        <div style={{
                            fontSize: '0.75rem',
                            color: 'var(--color-text-muted)',
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: '0.25rem',
                            justifyContent: 'center'
                        }}>
                            {equipment.targetMuscles.map((muscle, idx) => (
                                <span key={idx} style={{
                                    background: 'rgba(99, 102, 241, 0.2)',
                                    padding: '0.2rem 0.5rem',
                                    borderRadius: '0.25rem'
                                }}>
                                    {muscle}
                                </span>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {filteredEquipment.length === 0 && (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>
                    該当する器具が見つかりません
                </div>
            )}
        </div>
    );
};

export default EquipmentSelection;
