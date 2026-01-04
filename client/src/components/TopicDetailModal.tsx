import React, { useState } from 'react';
import { Topic, User, CATEGORY_NAMES, Comment, CommentType, CommentStance } from '../types';
import { X, ThumbsUp, ThumbsDown, Sparkles, Send, UserCircle, HelpCircle, BarChart3, Check, Heart, MessageSquare, Info, AlertTriangle, Mic, CheckCircle2, XCircle, MessageCircle } from 'lucide-react';

interface TopicDetailModalProps {
  topic: Topic;
  currentUser: User | null;
  onClose: () => void;
  onVoteComment: (topicId: string, commentId: string, type: 'up' | 'down') => void;
  onAddComment: (topicId: string, content: string, parentId?: string, type?: CommentType, stance?: CommentStance) => void;
  onRequestAnalysis: (topicId: string) => void;
  onVoteTopic: (topicId: string, type: 'credible' | 'controversial') => void;
  onVotePoll?: (topicId: string, optionId: string) => void;
  onToggleFavorite: (topicId: string) => void;
  onRequireAuth: () => void;
}

export const TopicDetailModal: React.FC<TopicDetailModalProps> = ({
  topic,
  currentUser,
  onClose,
  onVoteComment,
  onAddComment,
  onRequestAnalysis,
  onVoteTopic,
  onVotePoll,
  onToggleFavorite,
  onRequireAuth
}) => {
  const [newComment, setNewComment] = useState('');
  const [commentType, setCommentType] = useState<CommentType | null>(null);
  const [commentStance, setCommentStance] = useState<CommentStance>('neutral');

  const [replyText, setReplyText] = useState('');
  const [replyStance, setReplyStance] = useState<CommentStance>('neutral');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);

  const totalTopicVotes = topic.credibleVotes + topic.controversialVotes;
  const crediblePercentage = totalTopicVotes > 0
    ? Math.round((topic.credibleVotes / totalTopicVotes) * 100)
    : 0;
  const controversialPercentage = totalTopicVotes > 0 ? 100 - crediblePercentage : 0;
  const totalPollVotes = topic.options?.reduce((acc, opt) => acc + opt.voteCount, 0) || 0;

  const rootComments = topic.comments.filter(c => !c.parentId);
  const replies = topic.comments.filter(c => c.parentId);

  const sortedRootComments = [...rootComments].sort((a, b) => {
    const scoreA = a.upvotes - a.downvotes;
    const scoreB = b.upvotes - b.downvotes;
    return scoreB - scoreA;
  });

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return onRequireAuth();
    if (!newComment.trim() || !commentType) return;
    onAddComment(topic.id, newComment, undefined, commentType, commentStance);
    setNewComment('');
    setCommentType(null);
    setCommentStance('neutral');
  };

  const handleReplySubmit = (e: React.FormEvent, parentId: string) => {
    e.preventDefault();
    if (!currentUser) return onRequireAuth();
    if (!replyText.trim()) return;
    onAddComment(topic.id, replyText, parentId, 'general', replyStance); // Replies default to 'general' type for now, but have stance
    setReplyText('');
    setReplyingTo(null);
    setReplyStance('neutral');
  }

  const handleReplyClick = (commentId: string) => {
    if (!currentUser) return onRequireAuth();
    setReplyingTo(replyingTo === commentId ? null : commentId);
  }

  const getStanceColor = (stance: CommentStance) => {
    switch (stance) {
      case 'support': return 'border-emerald-500 bg-emerald-50/50';
      case 'oppose': return 'border-rose-500 bg-rose-50/50';
      default: return 'border-gray-200 bg-white';
    }
  }

  const getStanceBadge = (stance: CommentStance) => {
    switch (stance) {
      case 'support': return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">認可</span>;
      case 'oppose': return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 border border-rose-200">不認可</span>;
      default: return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 border border-gray-200">想說</span>;
    }
  }

  const getTypeIcon = (type: CommentType) => {
    switch (type) {
      case 'supplement': return <Info size={14} className="text-blue-500" />;
      case 'refutation': return <AlertTriangle size={14} className="text-red-500" />;
      default: return <Mic size={14} className="text-gray-500" />;
    }
  }

  const getTypeText = (type: CommentType) => {
    switch (type) {
      case 'supplement': return '補充';
      case 'refutation': return '反駁';
      default: return '想法';
    }
  }

  const renderComment = (comment: Comment, isReply = false) => {
    const commentReplies = replies.filter(r => r.parentId === comment.id);
    const borderColorClass = getStanceColor(comment.stance);

    return (
      <div key={comment.id} className={`flex gap-4 ${isReply ? 'mt-4' : ''}`}>
        <img src={comment.authorAvatar} className={`${isReply ? 'w-8 h-8' : 'w-10 h-10'} rounded-full shrink-0 border border-gray-200`} />
        <div className="flex-1">
          <div className={`p-4 rounded-xl rounded-tl-none shadow-sm border-l-4 ${borderColorClass} ${isReply ? 'bg-white border-gray-200' : ''}`}>
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-gray-900">{comment.authorName}</span>
                {/* Display country/IP info for cyber army prevention */}
                {(comment.country || (currentUser && (currentUser.level === 'admin' || currentUser.level === 'moderator') && comment.ipAddress)) && (
                  <span className="text-[10px] px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 font-medium flex items-center gap-1">
                    {comment.country && <span>🌍 {comment.country}</span>}
                    {currentUser && (currentUser.level === 'admin' || currentUser.level === 'moderator') && comment.ipAddress && (
                      <span className="text-gray-500 border-l border-amber-200 pl-1 ml-1">{comment.ipAddress}</span>
                    )}
                  </span>
                )}
                {/* Only show Type badge if it is NOT general */}
                {!isReply && comment.type !== 'general' && (
                  <div className="flex items-center gap-1 text-xs font-medium text-gray-500 bg-white/50 px-2 py-0.5 rounded-md border border-gray-200/50">
                    {getTypeIcon(comment.type)}
                    {getTypeText(comment.type)}
                  </div>
                )}
                {getStanceBadge(comment.stance)}
              </div>
              <span className="text-xs text-gray-400">{new Date(comment.timestamp).toLocaleDateString()}</span>
            </div>
            <p className="text-gray-800 leading-relaxed text-sm md:text-base">{comment.content}</p>
          </div>

          <div className="flex items-center gap-4 mt-2 ml-2">
            <button onClick={() => onVoteComment(topic.id, comment.id, 'up')} className={`flex items-center gap-1.5 text-xs md:text-sm font-bold transition-colors ${comment.userVote === 'up' ? 'text-green-600' : 'text-gray-400 hover:text-gray-600'}`}>
              <ThumbsUp size={16} className={comment.userVote === 'up' ? 'fill-current' : ''} />
              <span>合理</span>
              <span>{comment.upvotes}</span>
            </button>
            <button onClick={() => onVoteComment(topic.id, comment.id, 'down')} className={`flex items-center gap-1.5 text-xs md:text-sm font-bold transition-colors ${comment.userVote === 'down' ? 'text-red-600' : 'text-gray-400 hover:text-gray-600'}`}>
              <ThumbsDown size={16} className={comment.userVote === 'down' ? 'fill-current' : ''} />
              <span>不合理</span>
              <span>{comment.downvotes}</span>
            </button>
            {!isReply && (
              <button
                onClick={() => handleReplyClick(comment.id)}
                className="text-xs md:text-sm font-bold text-gray-400 hover:text-blue-600 ml-2"
              >
                回覆
              </button>
            )}
          </div>

          {/* Reply Input Form */}
          {replyingTo === comment.id && (
            <form onSubmit={(e) => handleReplySubmit(e, comment.id)} className="mt-4 animate-fadeIn p-3 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex gap-2 mb-2">
                <span className="text-xs font-bold text-gray-500 self-center">您的立場:</span>
                <button type="button" onClick={() => setReplyStance('support')} className={`px-2 py-1 rounded text-xs font-bold transition-all ${replyStance === 'support' ? 'bg-emerald-100 text-emerald-700 border border-emerald-300' : 'bg-white border border-gray-200 text-gray-500'}`}>認可</button>
                <button type="button" onClick={() => setReplyStance('neutral')} className={`px-2 py-1 rounded text-xs font-bold transition-all ${replyStance === 'neutral' ? 'bg-gray-200 text-gray-800 border border-gray-300' : 'bg-white border border-gray-200 text-gray-500'}`}>想說</button>
                <button type="button" onClick={() => setReplyStance('oppose')} className={`px-2 py-1 rounded text-xs font-bold transition-all ${replyStance === 'oppose' ? 'bg-rose-100 text-rose-700 border border-rose-300' : 'bg-white border border-gray-200 text-gray-500'}`}>不認可</button>
              </div>
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center shrink-0">
                  {currentUser ? <img src={currentUser.avatar} className="w-full h-full rounded-full" /> : <UserCircle size={20} />}
                </div>
                <div className="flex-1 relative">
                  <input
                    autoFocus
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="撰寫回覆..."
                    className="w-full bg-white border border-gray-300 rounded-lg py-2 px-3 pr-10 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                  <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 text-blue-600 hover:text-blue-800">
                    <Send size={16} />
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Render Nested Replies */}
          {commentReplies.length > 0 && (
            <div className="mt-4 pl-4 border-l-2 border-gray-100">
              {commentReplies.map(reply => renderComment(reply, true))}
            </div>
          )}
        </div>
      </div>
    );
  };

  const getCommentInputColor = () => {
    switch (commentStance) {
      case 'support': return 'bg-emerald-50 border-emerald-200';
      case 'oppose': return 'bg-rose-50 border-rose-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>

      <div className="bg-[#fffdf5] w-full max-w-4xl max-h-[90vh] rounded-xl shadow-2xl relative z-10 flex flex-col overflow-hidden border-8 border-white">
        {/* Header */}
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-start shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-gray-200 text-gray-700">
                {CATEGORY_NAMES[topic.category]}
              </span>
              <span className="text-xs text-gray-500">
                {new Date(topic.timestamp).toLocaleDateString('zh-TW')}
              </span>
            </div>
            <h2 className="text-2xl font-hand font-bold text-gray-900 leading-tight">{topic.title}</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
            <X size={24} className="text-gray-500" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto p-6 md:p-8 space-y-8 bg-[url('https://www.transparenttextures.com/patterns/notebook.png')]">

          {/* Voting / Poll Section */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            {topic.type === 'discussion' ? (
              <div>
                <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <HelpCircle size={20} className="text-blue-500" /> 大眾真實性評估
                </h4>
                <div className="relative w-full h-6 bg-gray-100 rounded-full overflow-hidden mb-3 flex">
                  {totalTopicVotes === 0 ? (
                    <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">尚無評分</div>
                  ) : (
                    <>
                      <div className="h-full bg-blue-500 flex items-center justify-start pl-3 text-xs text-white font-bold" style={{ width: `${crediblePercentage}%` }}>{crediblePercentage > 10 && `${crediblePercentage}%`}</div>
                      <div className="h-full bg-purple-500 flex items-center justify-end pr-3 text-xs text-white font-bold" style={{ width: `${controversialPercentage}%` }}>{controversialPercentage > 10 && `${controversialPercentage}%`}</div>
                    </>
                  )}
                </div>
                {/* 
                           Note: Direct topic voting buttons removed as requested. 
                           Topic scores are now derived from comment stances (Support/Oppose).
                        */}
              </div>
            ) : (
              <div>
                <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <BarChart3 size={20} className="text-purple-500" /> 投票結果
                </h4>
                <div className="space-y-3">
                  {topic.options?.map(opt => {
                    const percent = totalPollVotes > 0 ? Math.round((opt.voteCount / totalPollVotes) * 100) : 0;
                    return (
                      <button key={opt.id} onClick={() => onVotePoll && onVotePoll(topic.id, opt.id)} className="w-full relative h-10 rounded-lg border border-gray-200 overflow-hidden text-left group">
                        <div className={`absolute inset-y-0 left-0 transition-all ${topic.userPollVoteId === opt.id ? 'bg-blue-100' : 'bg-gray-100'}`} style={{ width: `${percent}%` }}></div>
                        <div className="absolute inset-0 flex items-center justify-between px-4 z-10">
                          <span className="font-medium text-gray-800">{opt.text}</span>
                          <span className="font-bold text-gray-600">{percent}%</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* AI Analysis */}
          <div className="bg-indigo-50 border-2 border-indigo-100 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-3 text-indigo-800 font-bold text-lg">
              <Sparkles size={24} /> AI 觀點歸納與分析
            </div>
            {topic.aiAnalysis ? (
              <p className="text-indigo-900 leading-relaxed whitespace-pre-wrap">{topic.aiAnalysis}</p>
            ) : (
              <button
                onClick={() => onRequestAnalysis(topic.id)}
                disabled={topic.isAnalyzing}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                {topic.isAnalyzing ? '正在歸納留言...' : '✨ 請求 AI 歸納與分析'}
              </button>
            )}
          </div>

          {/* Comments Section */}
          <div className="border-t-2 border-dashed border-gray-300 pt-6">
            <h3 className="text-xl font-hand font-bold mb-6 flex items-center gap-2">
              <MessageSquare size={24} /> 討論區 ({topic.comments.length})
            </h3>

            {/* New Interaction Buttons / Form */}
            {!commentType ? (
              <div className="grid grid-cols-3 gap-4 mb-8">
                <button
                  onClick={() => { if (!currentUser) onRequireAuth(); else { setCommentType('general'); setCommentStance('support'); } }}
                  className="flex flex-col items-center justify-center p-4 bg-emerald-50 border border-emerald-200 rounded-xl hover:bg-emerald-100 hover:scale-[1.02] transition-all group"
                >
                  <CheckCircle2 size={32} className="text-emerald-500 mb-2 group-hover:-translate-y-1 transition-transform" />
                  <span className="font-bold text-emerald-700">我認可</span>
                  <span className="text-xs text-emerald-400 mt-1">支持此觀點</span>
                </button>
                <button
                  onClick={() => { if (!currentUser) onRequireAuth(); else { setCommentType('general'); setCommentStance('oppose'); } }}
                  className="flex flex-col items-center justify-center p-4 bg-rose-50 border border-rose-200 rounded-xl hover:bg-rose-100 hover:scale-[1.02] transition-all group"
                >
                  <XCircle size={32} className="text-rose-500 mb-2 group-hover:-translate-y-1 transition-transform" />
                  <span className="font-bold text-rose-700">我不認可</span>
                  <span className="text-xs text-rose-400 mt-1">反對此觀點</span>
                </button>
                <button
                  onClick={() => { if (!currentUser) onRequireAuth(); else { setCommentType('general'); setCommentStance('neutral'); } }}
                  className="flex flex-col items-center justify-center p-4 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 hover:scale-[1.02] transition-all group"
                >
                  <MessageCircle size={32} className="text-gray-500 mb-2 group-hover:-translate-y-1 transition-transform" />
                  <span className="font-bold text-gray-700">我想說</span>
                  <span className="text-xs text-gray-400 mt-1">分享您的看法</span>
                </button>
              </div>
            ) : (
              <form onSubmit={handleCommentSubmit} className={`mb-8 p-4 rounded-xl border-2 ${getCommentInputColor()} animate-fadeIn`}>
                <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-200/50">
                  <div className="flex items-center gap-2">
                    {commentStance === 'support' && <><CheckCircle2 size={20} className="text-emerald-500" /><span className="font-bold text-emerald-700">您認可此觀點</span></>}
                    {commentStance === 'oppose' && <><XCircle size={20} className="text-rose-500" /><span className="font-bold text-rose-700">您不認可此觀點</span></>}
                    {commentStance === 'neutral' && <><MessageCircle size={20} className="text-gray-500" /><span className="font-bold text-gray-700">您的看法</span></>}
                  </div>
                  <button type="button" onClick={() => { setCommentType(null); setCommentStance('neutral'); }} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
                </div>

                {/* Stance Selector Removed as requested. Stance is pre-selected by the button clicked. */}

                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center shrink-0 overflow-hidden border-2 border-white shadow-sm">
                    {currentUser ? <img src={currentUser.avatar} className="w-full h-full object-cover" /> : <UserCircle size={24} className="text-gray-400" />}
                  </div>
                  <div className="flex-1 relative">
                    <textarea
                      autoFocus
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder={commentStance === 'support' ? "為什麼您支持這個觀點？" : commentStance === 'oppose' ? "請說明您反對的理由..." : "說說您的看法..."}
                      className="w-full bg-white border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-gray-400 focus:outline-none resize-none min-h-[80px]"
                      rows={3}
                    />
                  </div>
                </div>
                <div className="flex justify-end mt-3">
                  <button type="submit" className={`px-6 py-2 rounded-lg font-bold text-white shadow-sm transition-all hover:-translate-y-0.5 ${commentStance === 'support' ? 'bg-emerald-600 hover:bg-emerald-700' : commentStance === 'oppose' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-gray-800 hover:bg-gray-900'}`}>
                    發布
                  </button>
                </div>
              </form>
            )}

            {/* List of Root Comments */}
            <div className="space-y-6">
              {sortedRootComments.map(comment => renderComment(comment))}
              {sortedRootComments.length === 0 && (
                <div className="text-center text-gray-400 py-4 font-hand">成為第一個發言的人吧！</div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-between items-center shrink-0">
          <button onClick={() => onToggleFavorite(topic.id)} className={`flex items-center gap-2 font-bold transition-colors ${topic.isFavorite ? 'text-rose-500' : 'text-gray-500 hover:text-rose-500'}`}>
            <Heart size={20} className={topic.isFavorite ? 'fill-current' : ''} />
            {topic.isFavorite ? '已收藏' : '加入收藏'}
          </button>
          <button onClick={onClose} className="px-6 py-2 bg-gray-800 text-white rounded-lg font-bold hover:bg-black transition-colors">
            關閉
          </button>
        </div>
      </div>
    </div>
  );
}