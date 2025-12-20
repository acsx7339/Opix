import React, { useState, useMemo } from 'react';
import { Topic, Comment, User, CATEGORY_NAMES } from '../types';
import { ThumbsUp, ThumbsDown, Sparkles, Send, ChevronDown, ChevronUp, UserCircle, CheckCircle2, AlertTriangle, HelpCircle } from 'lucide-react';

interface TopicCardProps {
  topic: Topic;
  currentUser: User | null;
  onVoteComment: (topicId: string, commentId: string, type: 'up' | 'down') => void;
  onAddComment: (topicId: string, content: string) => void;
  onRequestAnalysis: (topicId: string) => void;
  onVoteTopic: (topicId: string, type: 'credible' | 'controversial') => void;
}

export const TopicCard: React.FC<TopicCardProps> = ({ 
  topic, 
  currentUser, 
  onVoteComment, 
  onAddComment,
  onRequestAnalysis,
  onVoteTopic
}) => {
  const [newComment, setNewComment] = useState('');
  const [showAllComments, setShowAllComments] = useState(false);

  // Sorting and Filtering Comments
  const { visibleComments, totalComments, hiddenCount } = useMemo(() => {
    const sorted = [...topic.comments].sort((a, b) => {
      const scoreA = a.upvotes - a.downvotes;
      const scoreB = b.upvotes - b.downvotes;
      return scoreB - scoreA; // Descending
    });

    const total = sorted.length;
    const visible = showAllComments ? sorted : sorted.slice(0, 3);
    
    return {
      visibleComments: visible,
      totalComments: total,
      hiddenCount: Math.max(0, total - 3)
    };
  }, [topic.comments, showAllComments]);

  // Topic Credibility Calculation
  const totalTopicVotes = topic.credibleVotes + topic.controversialVotes;
  const crediblePercentage = totalTopicVotes > 0 
    ? Math.round((topic.credibleVotes / totalTopicVotes) * 100) 
    : 0;
  const controversialPercentage = totalTopicVotes > 0 
    ? 100 - crediblePercentage 
    : 0;

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !currentUser) return;
    onAddComment(topic.id, newComment);
    setNewComment('');
    setShowAllComments(true); 
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6 overflow-hidden transition-all hover:shadow-md">
      {/* Header / Content */}
      <div className="p-6">
        <div className="flex items-center justify-between mb-3">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            {CATEGORY_NAMES[topic.category]}
          </span>
          <span className="text-sm text-gray-500">
            發布者：{topic.authorName} • {new Date(topic.timestamp).toLocaleDateString('zh-TW')}
          </span>
        </div>

        <h3 className="text-xl font-bold text-gray-900 mb-2">{topic.title}</h3>
        <p className="text-gray-700 leading-relaxed mb-6">{topic.description}</p>

        {/* --- Public Rating System --- */}
        <div className="bg-gray-50 rounded-xl p-4 mb-6 border border-gray-100">
            <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <HelpCircle size={16} />
                公眾真實性評級
            </h4>

            {/* Progress Bar */}
            <div className="relative w-full h-4 bg-gray-200 rounded-full overflow-hidden mb-3 flex">
                {totalTopicVotes === 0 ? (
                    <div className="w-full h-full bg-gray-100 flex items-center justify-center text-[10px] text-gray-400">尚無評分</div>
                ) : (
                    <>
                        <div 
                            className="h-full bg-emerald-500 transition-all duration-500" 
                            style={{ width: `${crediblePercentage}%` }}
                        />
                        <div 
                            className="h-full bg-orange-500 transition-all duration-500" 
                            style={{ width: `${controversialPercentage}%` }}
                        />
                    </>
                )}
            </div>
            
            <div className="flex items-center justify-between text-xs mb-4 px-1">
                <span className="text-emerald-700 font-medium">{crediblePercentage}% 認為可信</span>
                <span className="text-gray-400">{totalTopicVotes} 人參與投票</span>
                <span className="text-orange-700 font-medium">{controversialPercentage}% 認為有爭議/無法查證</span>
            </div>

            {/* Voting Buttons */}
            <div className="flex gap-3">
                <button
                    onClick={() => currentUser && onVoteTopic(topic.id, 'credible')}
                    disabled={!currentUser}
                    className={`flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                        topic.userTopicVote === 'credible'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm'
                        : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                    } ${!currentUser && 'opacity-60 cursor-not-allowed'}`}
                >
                    <CheckCircle2 size={16} className={topic.userTopicVote === 'credible' ? 'fill-emerald-100' : ''} />
                    可信 / 真實
                </button>
                <button
                    onClick={() => currentUser && onVoteTopic(topic.id, 'controversial')}
                    disabled={!currentUser}
                    className={`flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                        topic.userTopicVote === 'controversial'
                        ? 'bg-orange-50 border-orange-500 text-orange-700 shadow-sm'
                        : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                    } ${!currentUser && 'opacity-60 cursor-not-allowed'}`}
                >
                    <AlertTriangle size={16} className={topic.userTopicVote === 'controversial' ? 'fill-orange-100' : ''} />
                    有爭議 / 模糊
                </button>
            </div>
        </div>

        {/* AI Analysis Section */}
        {topic.aiAnalysis ? (
           <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-4 mb-4 animate-fadeIn">
             <div className="flex items-center gap-2 mb-2 text-indigo-800 font-semibold">
               <Sparkles size={18} />
               <span>AI 真相分析與驗證</span>
             </div>
             <p className="text-sm text-indigo-900 whitespace-pre-wrap leading-relaxed">{topic.aiAnalysis}</p>
           </div>
        ) : (
          <button 
            onClick={() => onRequestAnalysis(topic.id)}
            disabled={topic.isAnalyzing}
            className="flex items-center gap-2 text-sm text-indigo-600 font-medium hover:text-indigo-800 transition-colors mb-4 disabled:opacity-50"
          >
            <Sparkles size={16} />
            {topic.isAnalyzing ? '正在分析真實性...' : '請求 AI 驗證真實性'}
          </button>
        )}

        <div className="border-b border-gray-100 mb-4"></div>

        {/* Comment Input */}
        <form onSubmit={handleCommentSubmit} className="flex gap-3 mb-6">
          <div className="flex-shrink-0">
             {currentUser ? (
               <img src={currentUser.avatar} alt="Me" className="w-8 h-8 rounded-full" />
             ) : (
               <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                 <UserCircle size={20} className="text-gray-400" />
               </div>
             )}
          </div>
          <div className="flex-grow relative">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder={currentUser ? "加入討論..." : "請先登入以參與討論"}
              disabled={!currentUser}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2 px-4 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all disabled:opacity-60"
            />
            {newComment.trim() && (
              <button 
                type="submit" 
                className="absolute right-2 top-1/2 -translate-y-1/2 text-blue-600 hover:text-blue-700 p-1"
              >
                <Send size={16} />
              </button>
            )}
          </div>
        </form>

        {/* Comments List */}
        <div className="space-y-4">
           {visibleComments.length === 0 && (
             <p className="text-center text-gray-400 text-sm py-2">尚無討論，成為第一個發言的人吧！</p>
           )}

           {visibleComments.map((comment) => (
             <div key={comment.id} className="flex gap-3 animate-fadeIn">
                <img 
                  src={comment.authorAvatar} 
                  alt={comment.authorName} 
                  className="w-8 h-8 rounded-full flex-shrink-0 border border-gray-100" 
                />
                <div className="flex-grow">
                  <div className="bg-gray-50 rounded-lg p-3 rounded-tl-none">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-semibold text-gray-900">{comment.authorName}</span>
                      <span className="text-xs text-gray-400">{new Date(comment.timestamp).toLocaleDateString('zh-TW')}</span>
                    </div>
                    <p className="text-gray-800 text-sm">{comment.content}</p>
                  </div>
                  
                  {/* Action Bar */}
                  <div className="flex items-center gap-4 mt-1 ml-1">
                    <button 
                      onClick={() => currentUser && onVoteComment(topic.id, comment.id, 'up')}
                      disabled={!currentUser}
                      className={`flex items-center gap-1 text-xs font-medium transition-colors ${
                        comment.userVote === 'up' ? 'text-green-600' : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      <ThumbsUp size={14} className={comment.userVote === 'up' ? 'fill-current' : ''} />
                      {comment.upvotes}
                    </button>
                    
                    <button 
                      onClick={() => currentUser && onVoteComment(topic.id, comment.id, 'down')}
                      disabled={!currentUser}
                      className={`flex items-center gap-1 text-xs font-medium transition-colors ${
                        comment.userVote === 'down' ? 'text-red-600' : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      <ThumbsDown size={14} className={comment.userVote === 'down' ? 'fill-current' : ''} />
                      {comment.downvotes}
                    </button>

                    {(comment.upvotes - comment.downvotes) > 5 && (
                      <span className="text-xs text-amber-500 flex items-center gap-1 font-medium">
                        <Sparkles size={12} /> 高評價
                      </span>
                    )}
                  </div>
                </div>
             </div>
           ))}
        </div>

        {/* Show More / Show Less */}
        {totalComments > 3 && (
          <button 
            onClick={() => setShowAllComments(!showAllComments)}
            className="w-full mt-4 py-2 flex items-center justify-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
          >
            {showAllComments ? (
              <>
                <ChevronUp size={16} /> 僅顯示前三名
              </>
            ) : (
              <>
                <ChevronDown size={16} /> 顯示其餘 {hiddenCount} 則留言
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};
