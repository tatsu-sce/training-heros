import React, { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

const QRScanner = ({ onScanSuccess, onScanFailure }) => {
    const scannerRef = useRef(null);
    const [scanResult, setScanResult] = useState(null);

    useEffect(() => {
        // Avoid double rendering issues in React 18 strict mode
        if (!scannerRef.current) {
            scannerRef.current = new Html5QrcodeScanner(
                "reader",
                { fps: 10, qrbox: { width: 250, height: 250 } },
            /* verbose= */ false
            );

            scannerRef.current.render(
                (decodedText, decodedResult) => {
                    setScanResult(decodedText);
                    if (onScanSuccess) onScanSuccess(decodedText);
                    // Optional: Stop scanning after success
                    // scannerRef.current.clear(); 
                },
                (error) => {
                    if (onScanFailure) onScanFailure(error);
                }
            );
        }

        return () => {
            if (scannerRef.current) {
                scannerRef.current.clear().catch(error => {
                    console.error("Failed to clear html5-qrcode scanner. ", error);
                });
                scannerRef.current = null;
            }
        };
    }, [onScanSuccess, onScanFailure]);

    return (
        <div style={{ width: '100%', textAlign: 'center' }}>
            <div id="reader" style={{ width: '100%', borderRadius: '0.5rem', overflow: 'hidden' }}></div>
            {scanResult && (
                <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--color-success)', borderRadius: '0.5rem' }}>
                    Scanned: <strong>{scanResult}</strong>
                </div>
            )}
        </div>
    );
};

export default QRScanner;
