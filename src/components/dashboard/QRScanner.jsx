import React, { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

const QRScanner = ({ onScanSuccess, onScanFailure }) => {
    const scannerRef = useRef(null);
    const [scanResult, setScanResult] = useState(null);
    const scannerIdRef = useRef(`reader-${Math.random().toString(36).substr(2, 9)}`);
    const isMountedRef = useRef(false);

    useEffect(() => {
        // Prevent double initialization
        if (isMountedRef.current) return;
        isMountedRef.current = true;

        const scannerId = scannerIdRef.current;
        
        scannerRef.current = new Html5QrcodeScanner(
            scannerId,
            { fps: 10, qrbox: { width: 250, height: 250 } },
            /* verbose= */ false
        );

        scannerRef.current.render(
            (decodedText, decodedResult) => {
                setScanResult(decodedText);
                if (onScanSuccess) onScanSuccess(decodedText);
            },
            (error) => {
                if (onScanFailure) onScanFailure(error);
            }
        );

        return () => {
            if (scannerRef.current) {
                try {
                    scannerRef.current.clear().catch(error => {
                        console.error("Failed to clear html5-qrcode scanner. ", error);
                    });
                } catch (e) {
                    console.error("Error clearing scanner", e);
                }
                scannerRef.current = null;
            }
            
            // Clear the DOM element content
            const readerElement = document.getElementById(scannerIdRef.current);
            if (readerElement) {
                readerElement.innerHTML = "";
            }
            
            // Reset mounted flag so component can reinitialize on next mount
            isMountedRef.current = false;
        };
    }, []); // Empty deps - only run once

    return (
        <div style={{ width: '100%', textAlign: 'center' }}>
            <div id={scannerIdRef.current} style={{ width: '100%', borderRadius: '0.5rem', overflow: 'hidden' }}></div>
            {scanResult && (
                <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--color-success)', borderRadius: '0.5rem' }}>
                    Scanned: <strong>{scanResult}</strong>
                </div>
            )}
        </div>
    );
};

export default QRScanner;
