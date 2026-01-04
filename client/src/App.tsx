import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { TopicCard } from './components/TopicCard';
import { TopicDetailModal } from './components/TopicDetailModal';
import { AuthModal } from './components/AuthModal'; // Import AuthModal
import { ResetPasswordPage } from './components/ResetPasswordPage'; // Import ResetPasswordPage
import { InvitationModal } from './components/InvitationModal';
import { RulesModal } from './components/RulesModal';
import { ContactModal } from './components/ContactModal';
import { Topic, Category, User, CATEGORY_NAMES, SortOption, ViewMode, CommentType, CommentStance } from './types';
import { Menu, LogIn, LogOut, Loader2, AlertCircle, Search, Flame, Clock, PenTool, MoreHorizontal, ArrowRight, ChevronLeft, ChevronRight, Heart, X, CheckCircle, Gift, HelpCircle } from 'lucide-react';
import { analyzeTopicVeracity } from './services/geminiService';

const App: React.FC = () => {
  // Check for Password Reset Route
  if (window.location.pathname.startsWith('/reset-password/')) {
    return <ResetPasswordPage />;
  }

  const [user, setUser] = useState<User | null>(null);
  const [topics, setTopics] = useState<Topic[]>([]);

  const [viewMode, setViewMode] = useState<ViewMode>('home');
  const [homeTab, setHomeTab] = useState<'popular' | 'newest'>('popular'); // New state for Home Tabs

  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Auth State
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isInvitationModalOpen, setIsInvitationModalOpen] = useState(false);
  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyStatus, setVerifyStatus] = useState<'success' | 'error' | null>(null);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createTab, setCreateTab] = useState<'discussion' | 'poll'>('discussion');
  const [newTopicTitle, setNewTopicTitle] = useState('');
  const [newTopicCategory, setNewTopicCategory] = useState<Category>(Category.SCIENCE);
  const [pollOptions, setPollOptions] = useState<string[]>(['', '']);

  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');

  const [popularLimit, setPopularLimit] = useState(6); // Increased slightly for grid view
  const [recentLimit, setRecentLimit] = useState(6);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const handleSelectView = (mode: ViewMode, category?: Category) => {
    setViewMode(mode);
    setCurrentPage(1);
    if (category) {
      setSelectedCategory(category);
    } else {
      setSelectedCategory(null);
    }
  };

  // --- AUTH CHECK & EMAIL VERIFICATION ---
  useEffect(() => {
    const checkAuthAndVerify = async () => {
      // 1. Check for verification token in URL
      const params = new URLSearchParams(window.location.search);
      const verifyToken = params.get('verify_token');

      if (verifyToken) {
        setIsVerifying(true);
        try {
          const res = await fetch('/api/auth/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: verifyToken })
          });
          const data = await res.json();
          if (res.ok) {
            setVerifyStatus('success');
            if (data.token) {
              localStorage.setItem('token', data.token);
              setUser(data.user);
            }
          } else {
            setVerifyStatus('error');
          }
        } catch (e) {
          setVerifyStatus('error');
        } finally {
          setIsVerifying(false);
          // Clean URL
          window.history.replaceState({}, document.title, "/");
        }
      } else {
        // 2. Check Local Storage for existing session
        const token = localStorage.getItem('token');
        if (token) {
          try {
            const res = await fetch('/api/auth/me', {
              headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
              const data = await res.json();
              setUser(data.user);
            } else {
              localStorage.removeItem('token');
            }
          } catch (e) {
            localStorage.removeItem('token');
          }
        }
      }
    };

    checkAuthAndVerify();
  }, []);

  const fetchTopics = async () => {
    try {
      const url = user ? `/api/topics?userId=${user.id}` : '/api/topics';
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setTopics(data);
        setError(null);
        if (selectedTopic) {
          const updated = data.find((t: Topic) => t.id === selectedTopic.id);
          if (updated) setSelectedTopic(updated);
        }
      } else {
        throw new Error('無法連接至伺服器');
      }
    } catch (error) {
      console.error("Failed to fetch topics", error);
      setError("無法載入主題。請確認伺服器與資料庫已啟動。");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTopics();
  }, [user]);

  const handleLoginSuccess = (user: User, token: string) => {
    localStorage.setItem('token', token);
    setUser(user);
    setIsAuthModalOpen(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  // --- Handlers (With Token Injection) ---
  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    };
  };

  const handleVoteComment = async (topicId: string, commentId: string, type: 'up' | 'down') => {
    if (!user) { setIsAuthModalOpen(true); return; }
    try {
      const response = await fetch('/api/vote', { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify({ topicId, commentId, userId: user.id, type }) });
      if (response.ok) fetchTopics();
    } catch (error) { console.error("Vote failed", error); }
  };
  const handleVoteTopic = async (topicId: string, type: 'credible' | 'controversial') => {
    if (!user) { setIsAuthModalOpen(true); return; }
    try {
      const response = await fetch('/api/topics/vote', { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify({ topicId, userId: user.id, type }) });
      if (response.ok) fetchTopics();
    } catch (error) { console.error("Topic vote failed", error); }
  };
  const handleVotePoll = async (topicId: string, optionId: string) => {
    if (!user) { setIsAuthModalOpen(true); return; }
    try {
      const response = await fetch('/api/topics/poll/vote', { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify({ topicId, optionId, userId: user.id }) });
      if (response.ok) fetchTopics();
    } catch (error) { console.error("Poll vote failed", error); }
  };
  const handleToggleFavorite = async (topicId: string) => {
    if (!user) { setIsAuthModalOpen(true); return; };
    try {
      const response = await fetch('/api/favorite', { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify({ topicId, userId: user.id }) });
      if (response.ok) fetchTopics();
    } catch (error) { console.error("Favorite toggle failed", error); }
  };
  const handleAddComment = async (topicId: string, content: string, parentId?: string, type?: CommentType, stance?: CommentStance) => {
    if (!user) return;
    const newComment = {
      id: `c${Date.now()}`,
      topicId,
      authorId: user.id,
      authorName: user.username,
      authorAvatar: user.avatar,
      content,
      timestamp: Date.now(),
      parentId,
      type: type || 'general',
      stance: stance || 'neutral'
    };
    try {
      const response = await fetch('/api/comments', { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(newComment) });
      if (response.ok) fetchTopics();
    } catch (error) { console.error("Comment failed", error); }
  };
  const handleCreateButtonClick = () => {
    if (!user) { setIsAuthModalOpen(true); return; }
    setNewTopicTitle(''); setPollOptions(['', '']); setCreateTab('discussion'); setIsCreateModalOpen(true);
  };
  const handleAddPollOption = () => setPollOptions([...pollOptions, '']);
  const handleRemovePollOption = (index: number) => { const newOptions = [...pollOptions]; newOptions.splice(index, 1); setPollOptions(newOptions); };
  const handlePollOptionChange = (index: number, value: string) => { const newOptions = [...pollOptions]; newOptions[index] = value; setPollOptions(newOptions); };
  const handleCreateTopic = async (e: React.FormEvent) => {
    e.preventDefault(); if (!user) return;
    if (createTab === 'poll') { const validOptions = pollOptions.filter(o => o.trim() !== ''); if (validOptions.length < 2) { alert("投票至少需要兩個有效選項！"); return; } }

    // Check board access permission before creating
    try {
      const accessCheck = await fetch('/api/boards/check-access', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ category: newTopicCategory })
      });
      const accessData = await accessCheck.json();

      if (!accessData.canAccess) {
        const missingReqs = accessData.missingRequirements || [];
        const messages = missingReqs.map((req: any) => {
          if (req.type === 'loginCount') {
            return `需要登入 ${req.required} 次（目前 ${req.current} 次）`;
          }
          if (req.type === 'reputation') {
            return `需要聲望 ${req.required}（目前 ${req.current}）`;
          }
          return '權限不足';
        });
        alert(`無法發文到此看板\n\n${messages.join('\n')}`);
        return;
      }
    } catch (error) {
      console.error("Access check failed", error);
    }

    const topicId = `t${Date.now()}`;
    const newTopic = { id: topicId, title: newTopicTitle, description: newTopicTitle, category: newTopicCategory, authorName: user.username, timestamp: Date.now(), type: createTab, options: createTab === 'poll' ? pollOptions.filter(o => o.trim() !== '').map((text, idx) => ({ id: `${topicId}_opt_${idx}`, text: text })) : undefined };
    try {
      const response = await fetch('/api/topics', { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(newTopic) });
      if (response.ok) {
        setIsCreateModalOpen(false);
        fetchTopics();
      } else {
        const errorData = await response.json();
        alert(errorData.error || errorData.message || '發文失敗');
      }
    } catch (error) {
      console.error("Create topic failed", error);
      alert('無法連接伺服器');
    }
  };
  const handleRequestAnalysis = async (topicId: string) => {
    const topic = topics.find(t => t.id === topicId); if (!topic) return;
    setTopics(prev => prev.map(t => t.id === topicId ? { ...t, isAnalyzing: true } : t));
    const analysis = await analyzeTopicVeracity(topic);
    try { await fetch(`/api/topics/${topicId}/analysis`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ analysis }) }); fetchTopics(); } catch (error) { console.error("Failed to save analysis", error); }
  };

  // ... (UI Helpers same as before) ...
  const SectionHeader = ({
    icon: Icon, title, colorClass, limit, setLimit, onShowAll
  }: {
    icon: React.ElementType, title: string, colorClass: string, limit: number, setLimit: (n: number) => void, onShowAll: () => void
  }) => (
    <div className="flex items-center justify-between mb-6 bg-white/40 p-3 rounded-lg border border-gray-200/60">
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-hand font-bold text-gray-700">顯示設定</h2>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-sm text-gray-500 bg-white px-2 py-1 rounded border border-gray-200">
          <MoreHorizontal size={16} />
          <span className="text-xs font-bold">顯示:</span>
          <select
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
            className="bg-transparent font-bold outline-none cursor-pointer text-gray-800"
          >
            <option value={6}>6 篇</option>
            <option value={12}>12 篇</option>
            <option value={24}>24 篇</option>
          </select>
        </div>
        <button
          onClick={onShowAll}
          className="flex items-center gap-1 text-sm font-bold text-blue-600 hover:text-blue-800 hover:underline transition-all"
        >
          查看完整列表 <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );

  const renderTopicGrid = (list: Topic[], emptyMsg: string) => {
    if (list.length === 0) {
      return (
        <div className="col-span-full text-center py-20 bg-white/50 border-2 border-dashed border-gray-300 rounded-xl">
          <Search size={40} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-hand font-bold text-gray-600">{emptyMsg}</h3>
        </div>
      );
    }
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 items-start animate-fadeIn">
        {list.map(topic => (
          <TopicCard
            key={topic.id} topic={topic} currentUser={user}
            onVoteComment={handleVoteComment} onVoteTopic={handleVoteTopic}
            onVotePoll={handleVotePoll} onAddComment={handleAddComment}
            onRequestAnalysis={handleRequestAnalysis} onToggleFavorite={handleToggleFavorite}
            onOpenDetail={setSelectedTopic}
          />
        ))}
      </div>
    );
  };

  const renderHomeView = () => {
    // Logic for Popular List
    const popularTopics = [...topics].sort((a, b) => {
      const scoreA = a.comments.length + a.credibleVotes + a.controversialVotes + (a.options?.reduce((acc, o) => acc + o.voteCount, 0) || 0);
      const scoreB = b.comments.length + b.credibleVotes + b.controversialVotes + (b.options?.reduce((acc, o) => acc + o.voteCount, 0) || 0);
      return scoreB - scoreA;
    }).slice(0, popularLimit);

    // Logic for Newest List
    const recentTopics = [...topics].sort((a, b) => b.timestamp - a.timestamp).slice(0, recentLimit);

    return (
      <div className="space-y-6">
        {/* Custom Tab Switcher */}
        <div className="flex items-center gap-2 sm:gap-6 mb-8 border-b-2 border-dashed border-gray-300 pb-1">
          <button
            onClick={() => setHomeTab('popular')}
            className={`flex items-center gap-2 pb-2 text-xl sm:text-2xl font-hand font-bold transition-all border-b-4 rounded-t-lg px-4 ${homeTab === 'popular'
              ? 'text-orange-600 border-orange-500 bg-orange-50/50 pt-2'
              : 'text-gray-400 border-transparent hover:text-gray-600 hover:bg-gray-100/50 pt-2'
              }`}
          >
            <Flame size={24} className={homeTab === 'popular' ? 'fill-current animate-pulse' : ''} />
            熱門佈告欄
          </button>

          <button
            onClick={() => setHomeTab('newest')}
            className={`flex items-center gap-2 pb-2 text-xl sm:text-2xl font-hand font-bold transition-all border-b-4 rounded-t-lg px-4 ${homeTab === 'newest'
              ? 'text-blue-600 border-blue-500 bg-blue-50/50 pt-2'
              : 'text-gray-400 border-transparent hover:text-gray-600 hover:bg-gray-100/50 pt-2'
              }`}
          >
            <Clock size={24} />
            最新張貼
          </button>
        </div>

        {/* Tab Content */}
        <div className="min-h-[400px]">
          {homeTab === 'popular' && (
            <section>
              <SectionHeader
                icon={Flame}
                title="熱門佈告欄"
                colorClass="text-orange-500"
                limit={popularLimit}
                setLimit={setPopularLimit}
                onShowAll={() => { setSortBy('hot'); handleSelectView('all'); }}
              />
              {renderTopicGrid(popularTopics, "目前尚無熱門討論")}
            </section>
          )}

          {homeTab === 'newest' && (
            <section>
              <SectionHeader
                icon={Clock}
                title="最新張貼"
                colorClass="text-blue-500"
                limit={recentLimit}
                setLimit={setRecentLimit}
                onShowAll={() => { setSortBy('newest'); handleSelectView('all'); }}
              />
              {renderTopicGrid(recentTopics, "目前尚無新發布")}
            </section>
          )}
        </div>
      </div>
    );
  };

  const renderListView = () => {
    const processedTopics = topics
      .filter(t => { const categoryMatch = viewMode === 'all' || (viewMode === 'category' && t.category === selectedCategory); const searchMatch = t.title.toLowerCase().includes(searchQuery.toLowerCase()); return categoryMatch && searchMatch; })
      .sort((a, b) => {
        switch (sortBy) {
          case 'hot':
            const scoreA = a.comments.length + a.credibleVotes + a.controversialVotes;
            const scoreB = b.comments.length + b.credibleVotes + b.controversialVotes;
            return scoreB - scoreA;
          case 'controversial':
            // Revised Logic: Controversy = High volume AND small difference between credible/controversial
            // Formula: (Total Votes) - |Credible - Controversial|
            const totalA = a.credibleVotes + a.controversialVotes;
            const diffA = Math.abs(a.credibleVotes - a.controversialVotes);
            const splitScoreA = totalA - diffA;

            const totalB = b.credibleVotes + b.controversialVotes;
            const diffB = Math.abs(b.credibleVotes - b.controversialVotes);
            const splitScoreB = totalB - diffB;

            return splitScoreB - splitScoreA;
          case 'credible':
            return b.credibleVotes - a.credibleVotes;
          case 'newest':
          default:
            return b.timestamp - a.timestamp;
        }
      });

    const totalPages = Math.ceil(processedTopics.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedTopics = processedTopics.slice(startIndex, startIndex + itemsPerPage);
    return (
      <div className="space-y-6">
        <div className="mb-8 bg-white/60 p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-3xl font-hand font-bold text-gray-800 mb-4">
            {viewMode === 'all' ? '所有便利貼' : `${selectedCategory ? CATEGORY_NAMES[selectedCategory] : ''} 議題`}
          </h2>

          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex gap-2">
              <button onClick={() => setSortBy('newest')} className={`px-4 py-1.5 rounded-full shadow-sm border text-sm font-hand font-bold transition-all ${sortBy === 'newest' ? 'bg-yellow-200 border-yellow-300 scale-105' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>最新</button>
              <button onClick={() => setSortBy('hot')} className={`px-4 py-1.5 rounded-full shadow-sm border text-sm font-hand font-bold transition-all ${sortBy === 'hot' ? 'bg-orange-200 border-orange-300 scale-105' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>最熱</button>
              <button onClick={() => setSortBy('controversial')} className={`px-4 py-1.5 rounded-full shadow-sm border text-sm font-hand font-bold transition-all ${sortBy === 'controversial' ? 'bg-purple-200 border-purple-300 scale-105' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>爭議</button>
            </div>

            <div className="hidden sm:block h-6 w-px bg-gray-300"></div>

            <p className="text-gray-500 text-sm font-medium">
              第 {currentPage} 頁 / 共 {totalPages} 頁 (共 {processedTopics.length} 篇)
            </p>
          </div>
        </div>

        {renderTopicGrid(paginatedTopics, searchQuery ? `沒有找到包含 "${searchQuery}" 的便利貼。` : '此分類尚無主題。')}
        {totalPages > 1 && (<div className="flex justify-center items-center gap-4 py-8 mt-8 border-t border-dashed border-gray-300"><button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 rounded-full hover:bg-white hover:shadow disabled:opacity-30 disabled:hover:shadow-none transition-all"><ChevronLeft size={24} /></button><div className="flex gap-2">{Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (<button key={page} onClick={() => setCurrentPage(page)} className={`w-8 h-8 rounded-lg font-bold font-hand text-lg transition-all ${currentPage === page ? 'bg-gray-800 text-white shadow-md -translate-y-1' : 'bg-white text-gray-600 hover:bg-gray-100'}`}>{page}</button>))}</div><button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-2 rounded-full hover:bg-white hover:shadow disabled:opacity-30 disabled:hover:shadow-none transition-all"><ChevronRight size={24} /></button></div>)}
      </div>
    );
  };

  const renderFavoritesView = () => {
    const favTopics = topics.filter(t => t.isFavorite);
    return (<div><h2 className="text-3xl font-hand font-bold text-gray-800 mb-8 flex items-center gap-2"><Heart className="text-pink-500 fill-pink-500" /> 我的收藏夾</h2>{renderTopicGrid(favTopics, "您尚未收藏任何主題")}</div>);
  };

  if (isVerifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#faf8f6]">
        <div className="text-center">
          <Loader2 className="animate-spin mx-auto mb-4 text-gray-600" size={48} />
          <h2 className="text-2xl font-hand font-bold">正在驗證您的信箱...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Verify Toast */}
      {verifyStatus && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-lg shadow-xl font-bold flex items-center gap-2 animate-bounce ${verifyStatus === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
          {verifyStatus === 'success' ? <><CheckCircle size={20} /> 驗證成功！歡迎加入 Opix</> : <><AlertCircle size={20} /> 驗證失敗或連結已過期</>}
          <button onClick={() => setVerifyStatus(null)} className="ml-2 bg-white/20 rounded-full p-1"><X size={14} /></button>
        </div>
      )}

      <header className="h-16 bg-[#faf8f6] border-b border-gray-300 sticky top-0 z-40 px-4 flex items-center justify-between shadow-sm bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]">
        <div className="flex items-center gap-4">
          <button onClick={toggleSidebar} className="p-2 hover:bg-gray-200 rounded-lg md:hidden">
            <Menu className="text-gray-600" />
          </button>
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => handleSelectView('home')}>
            <img src="/opix-logo.png" className="w-8 h-8 rotate-3 shadow-md object-contain" alt="Opix Logo" />
            <h1 className="text-2xl font-hand font-bold text-gray-800 hidden sm:block">Opix</h1>
          </div>
        </div>

        <div className="flex-1 max-w-xl mx-4 hidden md:block">
          <div className="relative transform hover:scale-[1.02] transition-transform">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input type="text" placeholder="搜尋牆上的便利貼..." value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); if (e.target.value && (viewMode === 'home' || viewMode === 'favorites')) { setViewMode('all'); setSelectedCategory(null); } }} className="w-full bg-white border-2 border-gray-300 border-dashed rounded-lg py-1.5 pl-10 pr-4 text-sm focus:outline-none focus:border-gray-500 font-hand text-lg placeholder:font-sans placeholder:text-sm" />
          </div>
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-2">
              {/* User Level & Reputation Badge */}
              <div className="hidden lg:flex flex-col items-end text-xs">
                <div className="flex items-center gap-1">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${user.level === 'moderator' ? 'bg-purple-100 text-purple-700' :
                    user.level === 'expert' ? 'bg-blue-100 text-blue-700' :
                      user.level === 'member' ? 'bg-green-100 text-green-700' :
                        'bg-gray-100 text-gray-600'
                    }`}>
                    {user.level === 'moderator' ? '版主' :
                      user.level === 'expert' ? '專家' :
                        user.level === 'member' ? '正式會員' :
                          '見習生'}
                  </span>
                  <span className="text-gray-500">•</span>
                  <span className="font-bold text-orange-600">{user.reputation || 0} 聲望</span>
                </div>
                <span className="text-gray-400 text-[10px]">登入 {user.loginCount || 0} 次</span>
              </div>
              <span className="font-hand font-bold hidden md:block lg:hidden">{user.username}</span>

              {/* Invitation Code Button */}
              <button
                onClick={() => setIsInvitationModalOpen(true)}
                className="hidden sm:flex items-center gap-1 px-3 py-1.5 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-all text-sm font-bold"
                title="邀請碼管理"
              >
                <Gift size={16} />
                <span className="hidden md:inline">邀請碼</span>
              </button>

              {/* Help/Rules Button */}
              <button
                onClick={() => setIsRulesModalOpen(true)}
                className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-all"
                title="規則說明"
              >
                <HelpCircle size={20} />
              </button>

              <img src={user.avatar} alt="Avatar" className="w-9 h-9 rounded-full border-2 border-white shadow-sm" />
              <button onClick={handleLogout} className="text-gray-500 hover:text-red-600">
                <LogOut size={20} />
              </button>
            </div>
          ) : (
            <button onClick={() => setIsAuthModalOpen(true)} className="flex items-center gap-2 bg-gray-800 text-white px-4 py-1.5 rounded-sm shadow-md font-hand font-bold hover:bg-gray-700 hover:-rotate-1 transition-all">
              <LogIn size={16} /> 登入
            </button>
          )}
        </div>
      </header>

      <div className="flex flex-1 relative">
        <Sidebar
          viewMode={viewMode}
          selectedCategory={selectedCategory}
          onSelectView={handleSelectView}
          isOpen={isSidebarOpen}
          onCloseMobile={() => setIsSidebarOpen(false)}
          onContact={() => setIsContactModalOpen(true)}
        />
        <main className="flex-1 p-4 md:p-8 overflow-y-auto max-w-6xl mx-auto w-full">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <Loader2 size={40} className="animate-spin mb-4 text-gray-500" />
              <p className="font-hand text-xl">正在整理佈告欄...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center max-w-md mx-auto shadow-lg rotate-1">
              <AlertCircle size={48} className="mx-auto text-red-500 mb-4" />
              <p className="text-red-800 mb-4 font-bold">{error}</p>
              <button onClick={fetchTopics} className="px-4 py-2 bg-white border border-red-200 text-red-700 rounded shadow-sm hover:shadow-md font-hand font-bold">重試</button>
            </div>
          ) : (
            <>
              {viewMode === 'home' && renderHomeView()}
              {(viewMode === 'all' || viewMode === 'category') && renderListView()}
              {viewMode === 'favorites' && renderFavoritesView()}
            </>
          )}
        </main>
      </div>

      <button onClick={handleCreateButtonClick} className="fixed bottom-8 right-8 w-14 h-14 bg-gray-800 text-white rounded-full shadow-2xl flex items-center justify-center hover:bg-gray-700 hover:scale-110 hover:-rotate-12 transition-all duration-200 z-50 border-4 border-white">
        <PenTool size={28} />
      </button>

      {/* Modals */}
      {isAuthModalOpen && <AuthModal onClose={() => setIsAuthModalOpen(false)} onLoginSuccess={handleLoginSuccess} />}
      {isInvitationModalOpen && <InvitationModal onClose={() => setIsInvitationModalOpen(false)} />}
      {isRulesModalOpen && <RulesModal onClose={() => setIsRulesModalOpen(false)} />}
      {isContactModalOpen && <ContactModal onClose={() => setIsContactModalOpen(false)} />}

      {selectedTopic && (
        <TopicDetailModal
          topic={selectedTopic} currentUser={user} onClose={() => setSelectedTopic(null)}
          onVoteComment={handleVoteComment} onAddComment={handleAddComment} onRequestAnalysis={handleRequestAnalysis}
          onVoteTopic={handleVoteTopic} onVotePoll={handleVotePoll} onToggleFavorite={handleToggleFavorite}
          onRequireAuth={() => setIsAuthModalOpen(true)}
        />
      )}

      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsCreateModalOpen(false)}></div>
          <div className="bg-[#fffdf5] rounded-lg shadow-2xl w-full max-w-lg relative z-10 p-1 border-t-8 border-yellow-200">
            <div className="bg-white p-6 rounded shadow-inner">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-hand font-bold text-gray-800">張貼新便利貼</h3>
                <button onClick={() => setIsCreateModalOpen(false)}><X /></button>
              </div>
              <form onSubmit={handleCreateTopic} className="space-y-4">
                <div className="flex gap-2 mb-4 bg-gray-100 p-1 rounded-lg">
                  <button type="button" onClick={() => setCreateTab('discussion')} className={`flex-1 py-2 rounded-md font-bold text-sm transition-all ${createTab === 'discussion' ? 'bg-white shadow text-blue-600' : 'text-gray-500'}`}>一般議題</button>
                  <button type="button" onClick={() => setCreateTab('poll')} className={`flex-1 py-2 rounded-md font-bold text-sm transition-all ${createTab === 'poll' ? 'bg-white shadow text-purple-600' : 'text-gray-500'}`}>發起投票</button>
                </div>
                <input type="text" placeholder="標題..." value={newTopicTitle} onChange={e => setNewTopicTitle(e.target.value)} required className="w-full border-b-2 border-gray-200 focus:border-gray-500 outline-none py-2 text-lg font-hand bg-transparent" />
                <select value={newTopicCategory} onChange={e => setNewTopicCategory(e.target.value as Category)} className="w-full border p-2 rounded bg-gray-50">{Object.values(Category).map(c => <option key={c} value={c}>{CATEGORY_NAMES[c]}</option>)}</select>
                {createTab === 'poll' && (
                  <div className="space-y-2">
                    {pollOptions.map((opt, i) => (
                      <div key={i} className="flex gap-2"><input value={opt} onChange={e => handlePollOptionChange(i, e.target.value)} placeholder={`選項 ${i + 1}`} className="flex-1 border p-1 rounded text-sm" /> {pollOptions.length > 2 && <button type="button" onClick={() => handleRemovePollOption(i)}><X size={14} /></button>}</div>
                    ))}
                    <button type="button" onClick={handleAddPollOption} className="text-xs text-blue-500 font-bold">+ 新增選項</button>
                  </div>
                )}
                <div className="flex justify-end pt-4">
                  <button type="submit" className="bg-gray-800 text-white px-6 py-2 rounded font-hand font-bold shadow hover:bg-black transform hover:-rotate-1">張貼</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;