import React, { useState, useEffect } from 'react';
import { X, Copy, Check, Loader2, Gift, AlertCircle } from 'lucide-react';

interface InvitationCode {
    code: string;
    created_at: number | string;
    expires_at: number | string;
    used: boolean;
    used_by_username?: string;
}

interface InvitationModalProps {
    onClose: () => void;
}

export const InvitationModal: React.FC<InvitationModalProps> = ({ onClose }) => {
    const [codes, setCodes] = useState<InvitationCode[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [copiedCode, setCopiedCode] = useState<string | null>(null);

    const fetchCodes = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/invitations/my-codes', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                const data = await res.json();
                setCodes(data.codes || []);
                setError(null);
            } else {
                const errorData = await res.json();
                setError(errorData.error || '無法載入邀請碼');
            }
        } catch (err) {
            setError('無法連接伺服器');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchCodes();
    }, []);

    const handleGenerate = async () => {
        setIsGenerating(true);
        setError(null);

        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/invitations/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await res.json();

            if (res.ok) {
                await fetchCodes();
            } else {
                setError(data.error || '生成失敗');
            }
        } catch (err) {
            setError('無法連接伺服器');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleCopy = async (code: string) => {
        try {
            await navigator.clipboard.writeText(code);
            setCopiedCode(code);
            setTimeout(() => setCopiedCode(null), 2000);
        } catch (err) {
            console.error('Copy failed', err);
        }
    };

    const formatDate = (timestamp: number | string) => {
        console.log('formatDate input:', timestamp, typeof timestamp);

        // Convert to number if it's a string
        const num = typeof timestamp === 'string' ? parseInt(timestamp, 10) : timestamp;

        if (!num || num === 0 || isNaN(num)) {
            return '無效日期';
        }

        // Handle both seconds and milliseconds timestamps
        const ms = num > 10000000000 ? num : num * 1000;
        const date = new Date(ms);

        console.log('Converted to date:', date, 'isValid:', !isNaN(date.getTime()));

        if (isNaN(date.getTime())) {
            return '無效日期';
        }

        return date.toLocaleDateString('zh-TW', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
    };

    const isExpired = (expiresAt: number | string) => {
        const num = typeof expiresAt === 'string' ? parseInt(expiresAt, 10) : expiresAt;
        const ms = num > 10000000000 ? num : num * 1000;
        return Date.now() > ms;
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
            <div className="bg-[#fffdf5] rounded-xl shadow-2xl w-full max-w-2xl relative z-10 p-1 border-t-8 border-purple-300">
                <div className="bg-white p-6 rounded shadow-inner max-h-[80vh] overflow-y-auto">
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-2">
                            <Gift className="text-purple-600" size={28} />
                            <h2 className="text-2xl font-hand font-bold text-gray-800">我的邀請碼</h2>
                        </div>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                            <X size={20} />
                        </button>
                    </div>

                    {error && (
                        <div className="mb-4 bg-red-50 border border-red-200 text-red-600 text-sm p-3 rounded flex items-center gap-2">
                            <AlertCircle size={16} /> {error}
                        </div>
                    )}

                    <div className="mb-6">
                        <button
                            onClick={handleGenerate}
                            disabled={isGenerating}
                            className="w-full bg-purple-600 text-white py-3 rounded-lg font-bold hover:bg-purple-700 transition-all flex justify-center items-center gap-2 disabled:opacity-50"
                        >
                            {isGenerating ? (
                                <>
                                    <Loader2 size={18} className="animate-spin" />
                                    生成中...
                                </>
                            ) : (
                                <>
                                    <Gift size={18} />
                                    生成新邀請碼
                                </>
                            )}
                        </button>
                        <p className="text-xs text-gray-500 mt-2 text-center">
                            需要聲望 ≥ 5 才能生成邀請碼<br />
                            <span className="text-[10px]">見習生無法生成 • 會員最多3個 • 專家10個 • 版主20個 • 系統管理員無限制</span>
                        </p>
                    </div>

                    <div className="space-y-3">
                        {isLoading ? (
                            <div className="text-center py-8">
                                <Loader2 size={32} className="animate-spin mx-auto text-gray-400" />
                                <p className="text-gray-500 mt-2">載入中...</p>
                            </div>
                        ) : codes.length === 0 ? (
                            <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                                <Gift size={48} className="mx-auto text-gray-400 mb-3" />
                                <p className="text-gray-600">尚無邀請碼</p>
                                <p className="text-sm text-gray-500 mt-1">點擊上方按鈕生成</p>
                            </div>
                        ) : (
                            codes.map((code) => (
                                <div
                                    key={code.code}
                                    className={`p-4 rounded-lg border-2 ${code.used ? 'bg-gray-50 border-gray-200' :
                                        isExpired(code.expires_at) ? 'bg-red-50 border-red-200' :
                                            'bg-green-50 border-green-300'
                                        }`}
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <code className="text-lg font-mono font-bold text-gray-800 bg-white px-3 py-1 rounded border">
                                                {code.code}
                                            </code>
                                            <button
                                                onClick={() => handleCopy(code.code)}
                                                className="p-1.5 hover:bg-white rounded transition-all"
                                                title="複製"
                                            >
                                                {copiedCode === code.code ? (
                                                    <Check size={16} className="text-green-600" />
                                                ) : (
                                                    <Copy size={16} className="text-gray-600" />
                                                )}
                                            </button>
                                        </div>
                                        <span className={`text-xs font-bold px-2 py-1 rounded ${code.used ? 'bg-gray-200 text-gray-600' :
                                            isExpired(code.expires_at) ? 'bg-red-200 text-red-700' :
                                                'bg-green-200 text-green-700'
                                            }`}>
                                            {code.used ? '已使用' : isExpired(code.expires_at) ? '已過期' : '有效'}
                                        </span>
                                    </div>
                                    <div className="text-xs text-gray-600 space-y-1">
                                        <div>生成日期: {formatDate(code.created_at)}</div>
                                        <div>有效期至: {formatDate(code.expires_at)}</div>
                                        {code.used && code.used_by_username && (
                                            <div className="text-purple-600 font-bold">
                                                已被 {code.used_by_username} 使用
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
