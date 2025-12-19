import React from 'react';
import { QRCodeCanvas } from 'qrcode.react';

const QrCodes = () => {
    return (
        <div style={{ 
            minHeight: '100vh', 
            display: 'flex', 
            flexDirection: 'column',
            justifyContent: 'center', 
            alignItems: 'center', 
            background: '#111827',
            color: 'white',
            padding: '2rem'
        }}>
            <h1 style={{ marginBottom: '3rem', fontSize: '2rem' }}>Gym Access QR Codes</h1>
            
            <div style={{ display: 'flex', gap: '4rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                {/* Check In */}
                <div style={{ 
                    background: 'white', 
                    padding: '2rem', 
                    borderRadius: '1rem', 
                    textAlign: 'center',
                    color: 'black'
                }}>
                    <QRCodeCanvas value="gym_check_in" size={250} />
                    <h2 style={{ marginTop: '1rem', fontSize: '1.5rem', fontWeight: 'bold' }}>Check In</h2>
                    <p style={{ color: '#666' }}>Scan to enter</p>
                </div>

                {/* Check Out */}
                <div style={{ 
                    background: 'white', 
                    padding: '2rem', 
                    borderRadius: '1rem', 
                    textAlign: 'center',
                    color: 'black'
                }}>
                    <QRCodeCanvas value="gym_check_out" size={250} />
                    <h2 style={{ marginTop: '1rem', fontSize: '1.5rem', fontWeight: 'bold' }}>Check Out</h2>
                    <p style={{ color: '#666' }}>Scan to exit</p>
                </div>
            </div>

            <p style={{ marginTop: '3rem', color: '#6b7280' }}>
                Display this screen at the gym entrance.
            </p>
        </div>
    );
};

export default QrCodes;
