import React from 'react';
import { X, HelpCircle, Shield, Gift, MessageSquare, TrendingUp, Award } from 'lucide-react';

interface RulesModalProps {
    onClose: () => void;
}

export const RulesModal: React.FC<RulesModalProps> = ({ onClose }) => {
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
            <div className="bg-[#fffdf5] rounded-xl shadow-2xl w-full max-w-3xl relative z-10 p-1 border-t-8 border-blue-300">
                <div className="bg-white p-6 rounded shadow-inner max-h-[85vh] overflow-y-auto">
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-2">
                            <HelpCircle className="text-blue-600" size={28} />
                            <h2 className="text-2xl font-hand font-bold text-gray-800">平台規則說明</h2>
                        </div>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="space-y-6">
                        {/* 邀請碼規則 */}
                        <div className="bg-purple-50 p-4 rounded-lg border-l-4 border-purple-500">
                            <div className="flex items-center gap-2 mb-3">
                                <Gift className="text-purple-600" size={20} />
                                <h3 className="text-lg font-bold text-gray-800">邀請碼規則</h3>
                            </div>
                            <div className="text-sm text-gray-700 space-y-2">
                                <p><strong>註冊要求：</strong>必須使用有效邀請碼才能註冊</p>
                                <p><strong>生成條件：</strong>聲望 ≥ 5</p>
                                <p><strong>數量限制：</strong></p>
                                <ul className="list-disc list-inside ml-4 space-y-1">
                                    <li>👶 見習生：無法生成（需註冊滿3天升級）</li>
                                    <li>👤 正式會員：最多3個有效邀請碼</li>
                                    <li>🎓 專家：最多10個有效邀請碼</li>
                                    <li>👑 版主：最多20個有效邀請碼</li>
                                    <li>⚙️ 系統管理員：無限制</li>
                                </ul>
                                <p className="text-xs text-gray-500 mt-2">* 只計算未使用且未過期的邀請碼</p>
                            </div>
                        </div>

                        {/* 發文規則 */}
                        <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-500">
                            <div className="flex items-center gap-2 mb-3">
                                <MessageSquare className="text-green-600" size={20} />
                                <h3 className="text-lg font-bold text-gray-800">發文規則</h3>
                            </div>
                            <div className="text-sm text-gray-700 space-y-2">
                                <p><strong>每日限制：</strong>每位用戶每天最多發布 5 篇主題</p>
                                <p><strong>看板門檻：</strong></p>
                                <ul className="list-disc list-inside ml-4 space-y-1">
                                    <li>🏛️ 政治與社會：需登入 30 次</li>
                                    <li>💰 經濟與理財：無限制</li>
                                    <li>🏥 健康與醫療：無限制</li>
                                    <li>💻 科技與3C：無限制</li>
                                </ul>
                            </div>
                        </div>

                        {/* 等級系統 */}
                        <div className="bg-amber-50 p-4 rounded-lg border-l-4 border-amber-500">
                            <div className="flex items-center gap-2 mb-3">
                                <TrendingUp className="text-amber-600" size={20} />
                                <h3 className="text-lg font-bold text-gray-800">等級系統</h3>
                            </div>
                            <div className="text-sm text-gray-700 space-y-2">
                                <p><strong>等級晉升條件：</strong></p>
                                <ul className="list-disc list-inside ml-4 space-y-1">
                                    <li>👶 <strong>見習生</strong>：新註冊用戶（0-2天）</li>
                                    <li>👤 <strong>正式會員</strong>：註冊滿 3 天</li>
                                    <li>🎓 <strong>專家</strong>：聲望 ≥ 100</li>
                                    <li>👑 <strong>版主</strong>：由管理員指定</li>
                                </ul>
                                <p className="text-xs text-gray-500 mt-2">* 等級會自動更新，無需手動升級</p>
                            </div>
                        </div>

                        {/* 聲望系統 */}
                        <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
                            <div className="flex items-center gap-2 mb-3">
                                <Award className="text-blue-600" size={20} />
                                <h3 className="text-lg font-bold text-gray-800">聲望系統</h3>
                            </div>
                            <div className="text-sm text-gray-700 space-y-2">
                                <p><strong>獲得方式：</strong></p>
                                <ul className="list-disc list-inside ml-4 space-y-1">
                                    <li>發文或留言被其他用戶 upvote：+1 聲望</li>
                                </ul>
                                <p className="text-xs text-gray-500 mt-2">* downvote 不會扣除聲望</p>
                                <p><strong>用途：</strong></p>
                                <ul className="list-disc list-inside ml-4 space-y-1">
                                    <li>聲望 ≥ 5 可生成邀請碼</li>
                                    <li>聲望 ≥ 100 可升級為專家</li>
                                </ul>
                            </div>
                        </div>

                        {/* 行為規範 */}
                        <div className="bg-red-50 p-4 rounded-lg border-l-4 border-red-500">
                            <div className="flex items-center gap-2 mb-3">
                                <Shield className="text-red-600" size={20} />
                                <h3 className="text-lg font-bold text-gray-800">行為規範</h3>
                            </div>
                            <div className="text-sm text-gray-700 space-y-2">
                                <p><strong>禁止行為：</strong></p>
                                <ul className="list-disc list-inside ml-4 space-y-1">
                                    <li>發布不實資訊或惡意造謠</li>
                                    <li>人身攻擊或騷擾其他用戶</li>
                                    <li>發布違法或不當內容</li>
                                    <li>濫用邀請碼系統</li>
                                </ul>
                                <p className="text-xs text-red-600 mt-2">* 違反規範可能導致帳號停權</p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-gray-200 text-center">
                        <p className="text-xs text-gray-500">
                            如有任何疑問，請聯繫管理員
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
