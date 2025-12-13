import React, { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import Modal from '../ui/Modal';

const InquiryModal = ({ isOpen, onClose }) => {
    const { user } = useAuth();
    const [category, setCategory] = useState('General');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!message.trim()) return;

        setLoading(true);
        try {
            const { error } = await supabase
                .from('inquiries')
                .insert([{ user_id: user.id, category, message }]);

            if (error) throw error;

            alert('お問い合わせを受け付けました。ありがとうございます。');
            setMessage('');
            onClose();
        } catch (error) {
            console.error('Error submitting inquiry:', error);
            alert('送信に失敗しました。');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="お問い合わせ / Contact Us">
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>カテゴリー</label>
                    <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '0.8rem',
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            background: 'rgba(0,0,0,0.2)',
                            color: 'white'
                        }}
                    >
                        <option value="General">一般的な質問 / General</option>
                        <option value="Bug">不具合報告 / Bug Report</option>
                        <option value="Feature">機能リクエスト / Feature Request</option>
                        <option value="Facility">施設について / Facility</option>
                    </select>
                </div>

                <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>内容</label>
                    <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        rows={5}
                        required
                        placeholder="詳細をご記入ください..."
                        style={{
                            width: '100%',
                            padding: '0.8rem',
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            background: 'rgba(0,0,0,0.2)',
                            color: 'white',
                            resize: 'vertical'
                        }}
                    />
                </div>

                <button
                    type="submit"
                    className="btn-primary"
                    disabled={loading}
                    style={{ marginTop: '0.5rem' }}
                >
                    {loading ? '送信中...' : '送信する'}
                </button>
            </form>
        </Modal>
    );
};

export default InquiryModal;
