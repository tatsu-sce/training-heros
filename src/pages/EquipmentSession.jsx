import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import EquipmentTimer from '../components/dashboard/EquipmentTimer';
import EquipmentSelection from '../components/dashboard/EquipmentSelection';
import QRScanner from '../components/dashboard/QRScanner';
import Modal from '../components/ui/Modal';
import { supabase } from '../lib/supabaseClient';

const EquipmentSession = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [isScannerOpen, setIsScannerOpen] = useState(false);
    const [selectedEquipment, setSelectedEquipment] = useState(null);
    const isProcessingRef = React.useRef(false);

    const handleExitScan = async (decodedText) => {
        if (isProcessingRef.current) return;
        isProcessingRef.current = true;

        console.log("Exit Scan:", decodedText);
        
        if (decodedText === 'gym_check_out') {
            try {
                const { data, error } = await supabase.rpc('handle_occupancy', { 
                    action_type: 'check_out' 
                });

                if (error) {
                    throw error;
                }

                setIsScannerOpen(false); 
                isProcessingRef.current = false;
                navigate('/');
            } catch (err) {
                console.error("Error handling exit scan:", err);
                alert(`Failed: ${err.message || 'Unknown error'}`);
                isProcessingRef.current = false; 
            }
        } else {
            setIsScannerOpen(false);
            isProcessingRef.current = false;
            setTimeout(() => {
                alert('退出用QRコードのみ有効です');
            }, 100);
        }
    };

    const handleEquipmentSelect = (equipment) => {
        setSelectedEquipment(equipment);
    };

    return (
        <div className="container" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>
            <header style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                marginBottom: '2rem',
                flexWrap: 'wrap',
                gap: '1rem'
            }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <h1 className="gradient-text" style={{ fontSize: '1.5rem', marginBottom: '0.1rem', lineHeight: '1' }}>UniFit</h1>
                    <p style={{ color: 'var(--color-text-dim)', fontSize: '0.7rem', margin: 0 }}>Workout Session</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button
                        onClick={() => setIsScannerOpen(true)}
                        className="pulse-glow"
                        style={{
                            width: '64px',
                            height: '64px',
                            borderRadius: '18px',
                            background: 'rgba(239, 68, 68, 0.1)',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            color: '#ef4444',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            boxShadow: '0 8px 20px rgba(239, 68, 68, 0.2)',
                            position: 'relative',
                            overflow: 'hidden'
                        }}
                        title="Scan to Exit"
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-4px) scale(1.02)';
                            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
                            e.currentTarget.style.boxShadow = '0 12px 25px rgba(239, 68, 68, 0.4)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0) scale(1)';
                            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                            e.currentTarget.style.boxShadow = '0 8px 20px rgba(239, 68, 68, 0.2)';
                        }}
                    >
                        {/* Premium Logout/Exit QR icon style */}
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M3 3H9V9H3V3ZM5 5V7H7V5H5Z" fill="currentColor"/>
                            <path d="M3 15H9V21H3V15ZM5 17V19H7V17H5Z" fill="currentColor"/>
                            <path d="M15 3H21V9H15V3ZM17 5V7H19V5H17Z" fill="currentColor"/>
                            <path d="M15 15H17V17H15V15Z" fill="currentColor"/>
                            <path d="M17 17H19V19H17V17Z" fill="currentColor"/>
                            <path d="M19 15H21V17H19V15Z" fill="currentColor"/>
                            <path d="M15 19H17V21H15V19Z" fill="currentColor"/>
                            <path d="M19 19H21V21H19V19Z" fill="currentColor"/>
                            <path d="M11 11H13V13H11V11Z" fill="currentColor"/>
                            <path d="M11 3H13V9H11V3Z" fill="currentColor"/>
                            <path d="M3 11H9V13H3V11Z" fill="currentColor"/>
                            <path d="M15 11H21V13H15V11Z" fill="currentColor"/>
                            <path d="M11 15H13V21H11V15Z" fill="currentColor"/>
                            {/* Overlaying a small logout arrow indication */}
                            <path d="M12 12L14 10M12 12L14 14M12 12H18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        
                        {/* Subtle Inner Glow Overlay */}
                        <div style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            background: 'linear-gradient(to bottom, rgba(255,255,255,0.1), transparent)',
                            pointerEvents: 'none'
                        }} />
                    </button>
                </div>
            </header>

            {!selectedEquipment ? (
                /* Equipment Selection View */
                <div className="glass-panel" style={{ padding: '2rem' }}>
                    <EquipmentSelection onSelect={handleEquipmentSelect} />
                </div>
            ) : null}

            {/* Logging Modal */}
            <Modal 
                isOpen={!!selectedEquipment} 
                onClose={() => setSelectedEquipment(null)} 
                title="Workout Record"
            >
                {selectedEquipment && (
                    <EquipmentTimer 
                        equipment={selectedEquipment} 
                        onSave={() => {
                            setSelectedEquipment(null);
                        }}
                    />
                )}
            </Modal>

            {/* Exit Scanner Modal */}
            <Modal isOpen={isScannerOpen} onClose={() => { setIsScannerOpen(false); isProcessingRef.current = false; }} title="Scan to Exit / Switch">
                <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                    <p style={{ marginBottom: '1rem', color: 'var(--color-text-muted)' }}>Scan the QR code at the exit or on the next machine.</p>
                    <QRScanner key={isScannerOpen ? 'open' : 'closed'} onScanSuccess={handleExitScan} />
                </div>
            </Modal>
        </div>
    );
};

export default EquipmentSession;
