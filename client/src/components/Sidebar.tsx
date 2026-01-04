import React from 'react';
import { Category, CATEGORY_NAMES, ViewMode, User } from '../types';
import { LayoutGrid, Atom, Scale, History, Cpu, HeartPulse, Leaf, TrendingUp, Info, Coffee, Home, Heart, LogOut, Gift } from 'lucide-react';

interface SidebarProps {
  user: User | null;
  viewMode: ViewMode;
  selectedCategory: Category | null;
  onSelectView: (mode: ViewMode, category?: Category) => void;
  isOpen: boolean;
  onCloseMobile: () => void;
  onContact: () => void;
  onInvitation?: () => void; // Optional handler for opening invitation modal
}

const CATEGORY_ICONS: Record<Category, React.ReactNode> = {
  [Category.POLITICS]: <Scale size={18} />,
  [Category.ECONOMICS]: <TrendingUp size={18} />,
  [Category.HEALTH]: <HeartPulse size={18} />,
  [Category.TECHNOLOGY]: <Cpu size={18} />,
};

export const Sidebar: React.FC<SidebarProps> = ({ user, viewMode, selectedCategory, onSelectView, isOpen, onCloseMobile, onContact, onInvitation }) => {
  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-black/50 z-20 md:hidden" onClick={onCloseMobile} />}

      <aside className={`
        fixed top-16 bottom-0 left-0 w-64 bg-[#f8f5f2] border-r-2 border-[#e5e0d8] z-30 transition-transform duration-300 ease-in-out
        md:translate-x-0 md:static md:h-[calc(100vh-4rem)]
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        shadow-[inset_-10px_0_20px_-10px_rgba(0,0,0,0.05)]
      `}>
        <div className="flex flex-col h-full font-hand">

          <div className="p-6 overflow-y-auto flex-1">
            {/* Mobile-only User Profile Section */}
            {user && (
              <div className="md:hidden mb-6 bg-white/60 p-4 rounded-lg border border-gray-200 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <img src={user.avatar} alt="Avatar" className="w-10 h-10 rounded-full border-2 border-white shadow-sm" />
                  <div>
                    <h3 className="font-bold text-gray-800">{user.username}</h3>
                    <div className="flex items-center gap-2 text-xs mt-0.5">
                      <span className={`px-2 py-0.5 rounded-full font-bold ${user.level === 'moderator' ? 'bg-purple-100 text-purple-700' :
                        user.level === 'expert' ? 'bg-blue-100 text-blue-700' :
                          user.level === 'member' ? 'bg-green-100 text-green-700' :
                            'bg-gray-100 text-gray-600'
                        }`}>
                        {user.level === 'moderator' ? '版主' :
                          user.level === 'expert' ? '專家' :
                            user.level === 'member' ? '會員' : '見習'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex justify-between items-center text-xs text-gray-600 px-1 mb-3">
                  <span>聲望: <b className="text-orange-600">{user.reputation}</b></span>
                  <span>登入: <b>{user.loginCount}</b></span>
                </div>

                {/* Invitation Code Button in Sidebar */}
                <button
                  onClick={() => { if (onInvitation) onInvitation(); onCloseMobile(); }}
                  className="w-full flex items-center justify-center gap-2 py-1.5 bg-purple-100 text-purple-700 rounded-md text-xs font-bold hover:bg-purple-200 transition-colors"
                >
                  <Gift size={14} /> 我的邀請碼
                </button>
              </div>
            )}

            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6 border-b-2 border-dashed border-gray-300 pb-1">
              導航
            </h2>

            <nav className="space-y-3">
              <button onClick={() => { onSelectView('home'); onCloseMobile(); }} className={`w-full flex items-center px-2 py-1 text-lg font-bold transition-all hover:translate-x-1 ${viewMode === 'home' ? 'text-gray-800 marker-active' : 'text-gray-500'}`}>
                <Home size={20} className="mr-3" /> 首頁
              </button>
              <button onClick={() => { onSelectView('all'); onCloseMobile(); }} className={`w-full flex items-center px-2 py-1 text-lg font-bold transition-all hover:translate-x-1 ${viewMode === 'all' ? 'text-gray-800 marker-active' : 'text-gray-500'}`}>
                <LayoutGrid size={20} className="mr-3" /> 佈告欄
              </button>
              <button onClick={() => { onSelectView('favorites'); onCloseMobile(); }} className={`w-full flex items-center px-2 py-1 text-lg font-bold transition-all hover:translate-x-1 ${viewMode === 'favorites' ? 'text-pink-600' : 'text-gray-500'}`}>
                <Heart size={20} className="mr-3" /> 收藏夾
              </button>

              <div className="pt-6 pb-2">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest border-b-2 border-dashed border-gray-300 pb-1">分類標籤</h3>
              </div>

              {Object.values(Category).map((category) => (
                <button key={category} onClick={() => { onSelectView('category', category); onCloseMobile(); }} className={`w-full flex items-center px-2 py-1 text-base font-bold transition-all hover:translate-x-1 ${viewMode === 'category' && selectedCategory === category ? 'text-blue-700 bg-blue-50 rounded' : 'text-gray-600'}`}>
                  <span className="mr-3 opacity-70">{CATEGORY_ICONS[category]}</span>
                  {CATEGORY_NAMES[category]}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6 bg-[#f0ebe5] border-t-2 border-[#e5e0d8] space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-2 text-gray-800 font-bold">
                <Info size={16} /> 關於
              </div>
              <p className="text-sm text-gray-600 mb-4 leading-relaxed font-sans">
                這是一個「真相佈告欄」。我們用便利貼交換觀點，用圖釘標記事實。
              </p>
              <a href="#" className="block text-center w-full px-4 py-2 text-sm font-bold text-white bg-gray-800 rounded-sm shadow-md hover:bg-black transition-all rotate-1 hover:rotate-0">
                <Coffee size={14} className="inline mr-2" /> 買杯咖啡
              </a>
            </div>

            <div className="pt-4 border-t-2 border-dashed border-gray-300">
              <p className="text-sm text-gray-700 mb-3 font-bold">
                若有疑問以及反饋，歡迎在此處留言。
              </p>
              <button onClick={onContact} className="block text-center w-full px-4 py-2 text-sm font-bold text-white bg-blue-600 rounded-sm shadow-md hover:bg-blue-700 transition-all">
                💬 點擊留言
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};