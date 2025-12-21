import React, { useState } from 'react';
import { X, Mail, Send } from 'lucide-react';

interface ContactModalProps {
    onClose: () => void;
}

export const ContactModal: React.FC<ContactModalProps> = ({ onClose }) => {
    const [message, setMessage] = useState('');
    const [email, setEmail] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!message.trim()) return;

        setIsSending(true);
        setStatus('idle');

        try {
            const response = await fetch('/api/contact', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, message })
            });

            if (response.ok) {
                setStatus('success');
                setMessage('');
                setEmail('');
                setTimeout(() => {
                    onClose();
                }, 2000);
            } else {
                setStatus('error');
            }
        } catch (error) {
            console.error('Failed to send message:', error);
            setStatus('error');
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
            <div className="bg-[#fffdf5] rounded-xl shadow-2xl w-full max-w-md relative z-10 p-1 border-t-8 border-blue-300">
                <div className="bg-white p-6 rounded shadow-inner">
                    <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-2">
                            <Mail className="text-blue-600" size={24} />
                            <h2 className="text-xl font-hand font-bold text-gray-800">問題與反饋</h2>
                        </div>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                            <X size={20} />
                        </button>
                    </div>

                    <p className="text-sm text-gray-600 mb-4">
                        若有疑問以及反饋，歡迎在此處留言，我們會盡快處理。
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">
                                您的Email（選填）
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="your@email.com"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">
                                留言內容 <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[120px]"
                                placeholder="請輸入您的問題或建議..."
                                required
                            />
                        </div>

                        {status === 'success' && (
                            <div className="bg-green-100 text-green-700 px-4 py-2 rounded-lg text-sm">
                                ✓ 訊息已成功發送！
                            </div>
                        )}

                        {status === 'error' && (
                            <div className="bg-red-100 text-red-700 px-4 py-2 rounded-lg text-sm">
                                ✗ 發送失敗，請稍後再試
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isSending || !message.trim()}
                            className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-bold"
                        >
                            {isSending ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    發送中...
                                </>
                            ) : (
                                <>
                                    <Send size={16} />
                                    發送留言
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};
