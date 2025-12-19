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
                <button
                    onClick={() => navigate('/')}
                    style={{ 
                        fontSize: '1.2rem', 
                        color: 'var(--color-text-dim)', 
                        background: 'none', 
                        border: 'none', 
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        fontWeight: '600'
                    }}
                >
                    ← Dashboard
                </button>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button
                        onClick={() => setIsScannerOpen(true)}
                        style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '0.5rem', 
                            padding: '0.6rem 1.2rem',
                            borderRadius: '2rem',
                            background: 'rgba(239, 68, 68, 0.1)',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            color: '#ef4444',
                            cursor: 'pointer',
                            fontSize: '0.9rem',
                            fontWeight: 'bold',
                            transition: 'all 0.2s'
                        }}
                        className="btn-exit-scan"
                    >
                        <span>⏏️</span> 退出スキャン
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
