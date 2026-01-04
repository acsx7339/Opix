import React, { useState } from 'react';
import { X, Mail, Lock, User, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { User as UserType } from '../types';

interface AuthModalProps {
    onClose: () => void;
    onLoginSuccess: (user: UserType, token: string) => void;
}

type AuthMode = 'login' | 'register';

export const AuthModal: React.FC<AuthModalProps> = ({ onClose, onLoginSuccess }) => {
    const [mode, setMode] = useState<AuthMode>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');
    const [invitationCode, setInvitationCode] = useState('');
    const [codeValidating, setCodeValidating] = useState(false);
    const [codeValid, setCodeValid] = useState<boolean | null>(null);

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);
    const [isEarlyAccess, setIsEarlyAccess] = useState(false);

    React.useEffect(() => {
        if (mode === 'register') {
            fetch('/api/auth/registration-status')
                .then(res => res.json())
                .then(data => {
                    setIsEarlyAccess(data.isEarlyAccess);
                })
                .catch(err => console.error(err));
        }
    }, [mode]);

    // Validate invitation code
    const validateInvitationCode = async (code: string) => {
        if (!code || code.length < 6) {
            setCodeValid(null);
            return;
        }

        setCodeValidating(true);
        try {
            const res = await fetch('/api/invitations/validate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code })
            });
            const data = await res.json();
            setCodeValid(data.valid);
        } catch (err) {
            setCodeValid(false);
        } finally {
            setCodeValidating(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccessMsg(null);
        setIsLoading(true);

        try {
            if (mode === 'login') {
                const res = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password })
                });
                const data = await res.json();

                if (res.ok) {
                    onLoginSuccess(data.user, data.token);
                    onClose();
                } else {
                    setError(data.error || '登入失敗');
                }
            } else {
                const res = await fetch('/api/auth/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password, username, invitationCode })
                });
                const data = await res.json();

                if (res.ok) {
                    setSuccessMsg('註冊成功！請使用您的帳號登入。');
                } else {
                    setError(data.error || '註冊失敗');
                }
            }
        } catch (err) {
            setError('無法連接伺服器');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
            <div className="bg-[#fffdf5] rounded-xl shadow-2xl w-full max-w-md relative z-10 p-1 border-t-8 border-gray-800">
                <div className="bg-white p-8 rounded shadow-inner">
                    <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                        <X size={20} />
                    </button>

                    <h2 className="text-2xl font-hand font-bold text-center mb-6 text-gray-800">
                        {mode === 'login' ? '歡迎回來 Opix' : '加入 Opix'}
                    </h2>

                    {/* Tabs */}
                    <div className="flex mb-6 bg-gray-100 p-1 rounded-lg">
                        <button
                            onClick={() => { setMode('login'); setError(null); setSuccessMsg(null); }}
                            className={`flex-1 py-2 rounded-md text-sm font-bold transition-all ${mode === 'login' ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}
                        >
                            登入
                        </button>
                        <button
                            onClick={() => { setMode('register'); setError(null); setSuccessMsg(null); }}
                            className={`flex-1 py-2 rounded-md text-sm font-bold transition-all ${mode === 'register' ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}
                        >
                            註冊
                        </button>
                    </div>

                    {error && (
                        <div className="mb-4 bg-red-50 border border-red-200 text-red-600 text-sm p-3 rounded flex items-center gap-2">
                            <AlertCircle size={16} /> {error}
                        </div>
                    )}

                    {successMsg ? (
                        <div className="mb-4 bg-green-50 border border-green-200 text-green-700 p-4 rounded text-center">
                            <CheckCircle size={32} className="mx-auto mb-2 text-green-500" />
                            <h3 className="font-bold mb-1">請驗證您的信箱</h3>
                            <p className="text-sm">{successMsg}</p>
                            <button
                                onClick={() => { setMode('login'); setSuccessMsg(null); }}
                                className="mt-4 text-sm font-bold text-green-700 underline"
                            >
                                返回登入
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">使用者名稱</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <input
                                        type="text" required
                                        value={username} onChange={e => setUsername(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800 focus:outline-none"
                                        placeholder={mode === 'login' ? "請輸入使用者名稱" : "怎麼稱呼您？"}
                                    />
                                </div>
                            </div>

                            {mode === 'register' && (
                                <>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email</label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                            <input
                                                type="email" required
                                                value={email} onChange={e => setEmail(e.target.value)}
                                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800 focus:outline-none"
                                                placeholder="name@example.com"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                                            邀請碼 {!isEarlyAccess && <span className="text-red-500">*</span>}
                                            {isEarlyAccess && <span className="ml-2 text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full">早鳥免邀請碼</span>}
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                required={!isEarlyAccess}
                                                value={invitationCode}
                                                onChange={e => {
                                                    const val = e.target.value.toUpperCase();
                                                    setInvitationCode(val);
                                                    if (val) validateInvitationCode(val);
                                                    else setCodeValid(null);
                                                }}
                                                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-gray-800 focus:outline-none ${codeValid === true ? 'border-green-500 bg-green-50' :
                                                    (codeValid === false && invitationCode) ? 'border-red-500 bg-red-50' :
                                                        'border-gray-300'
                                                    }`}
                                                placeholder={isEarlyAccess ? "邀請碼 (選填)" : "輸入您的邀請碼"}
                                                maxLength={12}
                                            />
                                            {codeValidating && (
                                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                                    <Loader2 size={18} className="animate-spin text-gray-400" />
                                                </div>
                                            )}
                                            {!codeValidating && codeValid === true && (
                                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                                    <CheckCircle size={18} className="text-green-500" />
                                                </div>
                                            )}
                                            {!codeValidating && codeValid === false && invitationCode && (
                                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                                    <AlertCircle size={18} className="text-red-500" />
                                                </div>
                                            )}
                                        </div>
                                        {invitationCode && codeValid === false && (
                                            <p className="text-xs text-red-600 mt-1">
                                                邀請碼無效或已使用
                                            </p>
                                        )}
                                        <p className="text-xs text-gray-500 mt-1">
                                            {isEarlyAccess
                                                ? `目前是早鳥階段 (前 50 名)，可直接註冊！`
                                                : "需要邀請碼才能註冊。請向現有會員索取。"}
                                        </p>
                                    </div>
                                </>
                            )}

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">密碼</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <input
                                        type="password" required
                                        value={password} onChange={e => setPassword(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800 focus:outline-none"
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-gray-900 text-white py-2.5 rounded-lg font-bold hover:bg-black transition-all flex justify-center items-center gap-2 disabled:opacity-70"
                            >
                                {isLoading ? <Loader2 size={18} className="animate-spin" /> : (mode === 'login' ? '登入' : '註冊帳號')}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};