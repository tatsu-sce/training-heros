import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

const QRScanner = ({ onScanSuccess, onScanFailure }) => {
    const [scanResult, setScanResult] = useState(null);
    const [errorMsg, setErrorMsg] = useState(null);
    const [cameras, setCameras] = useState([]);
    const [selectedCameraId, setSelectedCameraId] = useState(null);
    const [isScanning, setIsScanning] = useState(false);
    
    const scannerIdRef = useRef(`reader-${Date.now()}`);
    const html5QrCodeRef = useRef(null);
    const hasScannedRef = useRef(false);

    useEffect(() => {
        const scannerId = scannerIdRef.current;
        html5QrCodeRef.current = new Html5Qrcode(scannerId);

        // 1. Get available cameras
        Html5Qrcode.getCameras().then(devices => {
            if (devices && devices.length > 0) {
                setCameras(devices);
                // Try to find a back camera
                const backCamera = devices.find(d => 
                    d.label.toLowerCase().includes('back') || 
                    d.label.toLowerCase().includes('rear') ||
                    d.label.toLowerCase().includes('environment') ||
                    d.label.toLowerCase().includes('out') ||
                    d.label.includes('背面') ||
                    d.label.includes('リア') ||
                    d.label.includes('バック') ||
                    d.label.includes('外側')
                );
                const defaultId = backCamera ? backCamera.id : devices[0].id;
                setSelectedCameraId(defaultId);
                startCamera(defaultId);
            } else {
                setErrorMsg("No cameras found. Please check browser permissions.");
            }
        }).catch(err => {
            console.error("Error getting cameras", err);
            setErrorMsg("Could not access camera list. Please ensure you are using HTTPS and have granted permissions.");
        });

        return () => {
            stopScanner();
        };
    }, []);

    const startCamera = async (cameraId) => {
        if (!html5QrCodeRef.current) return;
        
        try {
            if (isScanning) {
                await stopScanner();
            }

            const config = { 
                fps: 15, // Slightly higher FPS for smoother scanning
                qrbox: { width: 250, height: 250 } 
            };

            await html5QrCodeRef.current.start(
                cameraId,
                config,
                (decodedText) => {
                    if (hasScannedRef.current) return;
                    hasScannedRef.current = true;
                    setScanResult(decodedText);
                    if (onScanSuccess) onScanSuccess(decodedText);
                    stopScanner();
                },
                () => {} // Ignore scan errors
            );
            setIsScanning(true);
            setErrorMsg(null);
        } catch (err) {
            console.error("Start Error", err);
            setErrorMsg(`Camera Start Failed: ${err}. Try selecting a different camera if available.`);
            setIsScanning(false);
        }
    };

    const stopScanner = async () => {
        if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
            try {
                await html5QrCodeRef.current.stop();
                setIsScanning(false);
            } catch (e) {
                console.error("Stop Error", e);
            }
        }
    };

    const handleCameraChange = (e) => {
        const newId = e.target.value;
        setSelectedCameraId(newId);
        startCamera(newId);
    };

    return (
        <div style={{ width: '100%', textAlign: 'center' }}>
            {/* Diagnosis Info */}
            {!window.isSecureContext && (
                <div style={{ marginBottom: '1rem', padding: '0.8rem', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: '8px', fontSize: '0.8rem' }}>
                    ⚠️ Not a Secure Context. Camera will be blocked. Please access via HTTPS.
                </div>
            )}

            <div 
                id={scannerIdRef.current} 
                style={{ 
                    width: '100%', 
                    minHeight: '260px',
                    borderRadius: '16px', 
                    overflow: 'hidden',
                    background: '#000',
                    border: '1px solid rgba(255,255,255,0.1)',
                    position: 'relative'
                }}
            />

            {/* Controls */}
            <div style={{ marginTop: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                <div style={{ display: 'flex', gap: '0.8rem', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap' }}>
                    {cameras.length > 1 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-dim)' }}>Switch:</span>
                            <select 
                                value={selectedCameraId || ""} 
                                onChange={handleCameraChange}
                                style={{ 
                                    background: 'rgba(255,255,255,0.05)', 
                                    color: 'white', 
                                    border: '1px solid rgba(255,255,255,0.2)',
                                    borderRadius: '8px',
                                    padding: '0.4rem 0.6rem',
                                    fontSize: '0.85rem',
                                    outline: 'none'
                                }}
                            >
                                {cameras.map(c => (
                                    <option key={c.id} value={c.id}>{c.label || `Camera ${c.id.substring(0,5)}`}</option>
                                ))}
                            </select>
                        </div>
                    )}
                    
                    <button 
                        onClick={() => window.location.reload()}
                        className="btn-secondary"
                        style={{ fontSize: '0.85rem', padding: '0.4rem 1rem', borderRadius: '8px' }}
                    >
                        🔄 Reload
                    </button>
                </div>
            </div>

            {errorMsg && (
                <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: '12px', fontSize: '0.85rem', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                    <p style={{ margin: 0 }}>⚠️ {errorMsg}</p>
                </div>
            )}

            {scanResult && (
                <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--color-success)', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                    ✅ Scanned: <strong>{scanResult}</strong>
                </div>
            )}
        </div>
    );
};

export default QRScanner;
