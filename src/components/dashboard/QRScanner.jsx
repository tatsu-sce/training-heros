import React, { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

const QRScanner = ({ onScanSuccess, onScanFailure }) => {
    const scannerRef = useRef(null);
    const [scanResult, setScanResult] = useState(null);
    const scannerIdRef = useRef(`reader-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
    const hasInitializedRef = useRef(false);
    const hasScannedRef = useRef(false);

    useEffect(() => {
        // Prevent any double initialization
        if (hasInitializedRef.current) return;
        hasInitializedRef.current = true;

        const scannerId = scannerIdRef.current;
        
        // Ensure DOM element exists and is clean
        const readerElement = document.getElementById(scannerId);
        if (!readerElement) {
            console.error("Scanner element not found");
            return;
        }
        readerElement.innerHTML = "";
        
        scannerRef.current = new Html5QrcodeScanner(
            scannerId,
            { 
                fps: 10, 
                qrbox: { width: 250, height: 250 },
                // Prefer back camera on mobile
                videoConstraints: {
                    facingMode: "environment"
                },
                // Add support for mobile browsers
                rememberLastUsedCamera: true,
                supportedScanTypes: [0] // 0 = QR CODE
            },
            /* verbose= */ false
        );

        scannerRef.current.render(
            (decodedText, decodedResult) => {
                // Prevent multiple callbacks for the same scan
                if (hasScannedRef.current) return;
                hasScannedRef.current = true;
                
                setScanResult(decodedText);
                if (onScanSuccess) onScanSuccess(decodedText);
                // Stop scanning after success to prevent multiple alerts
                if (scannerRef.current) {
                    try {
                        scannerRef.current.clear().catch(err => console.error("Failed to stop scanner", err));
                        scannerRef.current = null;
                    } catch (e) {
                        console.error("Error stopping scanner", e);
                    }
                }
            },
            (error) => {
                // Only log significant errors, ignore frequent framing errors
                if (error?.includes("NotFoundException") || error?.includes("NotReadableError")) {
                    console.warn("QR Scan error:", error);
                }
                if (onScanFailure) onScanFailure(error);
            }
        );

        return () => {
            // Cleanup
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
            const element = document.getElementById(scannerId);
            if (element) {
                element.innerHTML = "";
            }
            
            // Reset flags
            hasInitializedRef.current = false;
            hasScannedRef.current = false;
        };
    }, []); // Empty deps - only run once per mount

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
