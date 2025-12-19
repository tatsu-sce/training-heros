import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import EquipmentTimer from '../components/dashboard/EquipmentTimer';
import QRScanner from '../components/dashboard/QRScanner';
import Modal from '../components/ui/Modal';
import { supabase } from '../lib/supabaseClient';

const EquipmentSession = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [isScannerOpen, setIsScannerOpen] = useState(false);
    const [scanResult, setScanResult] = useState('');
    const isProcessingRef = React.useRef(false); // Lock to prevent multiple scans

    const handleExitScan = async (decodedText) => {
        // Prevent multiple scans
        if (isProcessingRef.current) return;
        isProcessingRef.current = true;
        // Do NOT close immediately: setIsScannerOpen(false);

        console.log("Exit Scan:", decodedText);
        
        let action = null;
        if (decodedText === 'gym_check_out') action = 'check_out';
        else if (decodedText === 'gym_check_in') action = 'check_in'; // Just in case

        if (action) {
            try {
                const { data, error } = await supabase.rpc('handle_occupancy', { 
                    action_type: action 
                });

                if (error) {
                    throw error;
                }

                setIsScannerOpen(false); 
                isProcessingRef.current = false;
                navigate('/'); // Return to dashboard
            } catch (err) {
                console.error("Error handling exit scan:", err);
                alert(`Failed: ${err.message || 'Unknown error'}`);
                isProcessingRef.current = false; 
            }
        } else {
            // Legacy/Mock fallback for other QR codes (equipment switching)
             // Logic for switching equipment would go here
             setIsScannerOpen(false);
             isProcessingRef.current = false;
             navigate('/');
        }
    };

    return (
        <div className="container" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <button
                    onClick={() => navigate('/')}
                    style={{ fontSize: '1.5rem', color: 'var(--color-text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}
                >
                    ← Dashboard
                </button>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button
                        className="btn-secondary"
                        onClick={() => setIsScannerOpen(true)}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', border: '1px solid var(--color-error)', color: 'var(--color-error)' }}
                    >
                        <span>⏏️</span> End/Exit (Scan)
                    </button>
                </div>
            </header>

            <h1 className="gradient-text" style={{ fontSize: '2rem', marginBottom: '1.5rem', textAlign: 'center' }}>Equipment Session</h1>

            {/* Equipment Timer & Logger */}
            <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
                <EquipmentTimer />
            </div>

            {/* Helper Text */}
            <p style={{ textAlign: 'center', color: 'var(--color-text-dim)', fontSize: '0.9rem' }}>
                Record your sets, reps, and time. When finished with this station, <br />
                scan the exit QR code or the next equipment's QR code.
            </p>

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
