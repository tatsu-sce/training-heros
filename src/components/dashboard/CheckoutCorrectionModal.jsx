import React, { useState } from 'react';
import Modal from '../ui/Modal';
import { supabase } from '../../lib/supabaseClient';

const CheckoutCorrectionModal = ({ isOpen, onClose, lastCheckInAt, onCorrectionComplete }) => {
    const [duration, setDuration] = useState(60);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const { error } = await supabase.rpc('record_corrected_checkout', {
                provided_duration_minutes: parseInt(duration)
            });

            if (error) throw error;

            alert('滞在時間を記録しました。ご協力ありがとうございます！');
            onCorrectionComplete();
            onClose();
        } catch (err) {
            console.error('Error recording correction:', err);
            alert('記録に失敗しました: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const formatStartTime = () => {
        if (!lastCheckInAt) return '';
        const date = new Date(lastCheckInAt);
        return date.toLocaleString('ja-JP', {
            month: 'numeric',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="退室記録の確認">
            <div style={{ padding: '0.5rem' }}>
                <div style={{
                    background: 'rgba(245, 158, 11, 0.1)',
                    border: '1px solid rgba(245, 158, 11, 0.3)',
                    borderRadius: '12px',
                    padding: '1rem',
                    marginBottom: '1.5rem',
                    color: '#f59e0b',
                    fontSize: '0.9rem',
                    lineHeight: '1.5'
                }}>
                    <strong>⚠️ 退室記録が見つかりませんでした</strong><br />
                    前回（{formatStartTime()}）の入室後、退室スキャンを忘れたようです。おおよその滞在時間を教えてください。
                </div>

                <div style={{ marginBottom: '2rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--color-text-dim)', fontSize: '0.85rem' }}>
                        滞在時間（分）
                    </label>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                        <input
                            type="number"
                            min="1"
                            max="600"
                            value={duration}
                            onChange={(e) => setDuration(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '1rem',
                                paddingRight: '3rem',
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '12px',
                                color: 'var(--color-text)',
                                fontSize: '1.2rem',
                                fontWeight: 'bold',
                                outline: 'none',
                                transition: 'all 0.3s ease'
                            }}
                            onFocus={(e) => e.target.style.borderColor = 'var(--color-primary)'}
                            onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                        />
                        <span style={{
                            position: 'absolute',
                            right: '1rem',
                            color: 'var(--color-text-dim)',
                            pointerEvents: 'none'
                        }}>分</span>
                    </div>
                </div>

                <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="btn-primary"
                    style={{ width: '100%', justifyContent: 'center' }}
                >
                    {loading ? '保存中...' : '記録して閉じる'}
                </button>
            </div>
        </Modal>
    );
};

export default CheckoutCorrectionModal;
