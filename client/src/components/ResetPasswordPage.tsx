import React, { useState } from 'react';
import { Lock, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

export const ResetPasswordPage: React.FC = () => {
    // Extract token from URL path
    const token = window.location.pathname.split('/reset-password/')[1];
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (password.length < 6) {
            setError('密碼至少需要6個字元');
            return;
        }

        if (password !== confirmPassword) {
            setError('兩次輸入的密碼不一致');
            return;
        }

        setIsLoading(true);

        try {
            const res = await fetch(`/api/auth/reset-password/${token}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password })
            });
            const data = await res.json();

            if (res.ok) {
                setSuccess(true);
                setTimeout(() => {
                    window.location.href = '/';
                }, 3000);
            } else {
                setError(data.error || '重置失敗');
            }
        } catch (err) {
            setError('無法連接伺服器');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-8">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Lock size={32} className="text-blue-600" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">重置密碼</h1>
                    <p className="text-gray-600 mt-2">請輸入您的新密碼</p>
                </div>

                {error && (
                    <div className="mb-4 bg-red-50 border border-red-200 text-red-600 text-sm p-3 rounded flex items-center gap-2">
                        <AlertCircle size={16} /> {error}
                    </div>
                )}

                {success ? (
                    <div className="text-center bg-green-50 border border-green-200 text-green-700 p-6 rounded">
                        <CheckCircle size={48} className="mx-auto mb-4 text-green-500" />
                        <h3 className="font-bold text-lg mb-2">密碼重置成功！</h3>
                        <p className="text-sm">即將返回首頁...</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">新密碼</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    placeholder="至少6個字元"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">確認新密碼</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="password"
                                    required
                                    value={confirmPassword}
                                    onChange={e => setConfirmPassword(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    placeholder="再次輸入新密碼"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition-all flex justify-center items-center gap-2 disabled:opacity-70"
                        >
                            {isLoading ? <Loader2 size={18} className="animate-spin" /> : '重置密碼'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};
