import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

const QRGenerator = ({ value, title = "My QR Code" }) => {
    return (
        <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <h3 style={{ marginBottom: '1.5rem' }}>{title}</h3>
            <div style={{ padding: '1rem', background: 'white', borderRadius: '1rem' }}>
                <QRCodeSVG value={value} size={200} />
            </div>
            <p style={{ marginTop: '1.5rem', color: 'var(--color-text-muted)', fontSize: '0.9rem', textAlign: 'center' }}>
                Show this code to the scanner<br />to check in/out instantly.
            </p>
        </div>
    );
};

export default QRGenerator;
