import React, { useMemo } from 'react';
import { Topic, User, CATEGORY_NAMES, Category, CommentType, CommentStance } from '../types';
import { ThumbsUp, Sparkles, HelpCircle, BarChart3, Heart, Maximize2 } from 'lucide-react';

interface TopicCardProps {
    topic: Topic;
    currentUser: User | null;
    onVoteComment: (topicId: string, commentId: string, type: 'up' | 'down') => void;
    onAddComment: (topicId: string, content: string, parentId?: string, type?: CommentType, stance?: CommentStance) => void;
    onRequestAnalysis: (topicId: string) => void;
    onVoteTopic: (topicId: string, type: 'credible' | 'controversial') => void;
    onVotePoll?: (topicId: string, optionId: string) => void;
    onToggleFavorite: (topicId: string) => void;
    // New prop to trigger modal
    onOpenDetail: (topic: Topic) => void;
}

// Pastel Sticky Note Colors mapped to categories
const CATEGORY_STYLES: Record<Category, string> = {
    [Category.POLITICS]: 'bg-rose-100 text-rose-900',
    [Category.ECONOMICS]: 'bg-orange-100 text-orange-900',
    [Category.HEALTH]: 'bg-emerald-100 text-emerald-900',
    [Category.TECHNOLOGY]: 'bg-indigo-100 text-indigo-900',
};

export const TopicCard: React.FC<TopicCardProps> = ({
    topic,
    currentUser,
    onVoteTopic,
    onVotePoll,
    onToggleFavorite,
    onOpenDetail
}) => {

    const { visibleComments, totalComments } = useMemo(() => {
        // Only show top 2 comments on the sticky note to save space
        // Filter out replies from preview
        const rootComments = topic.comments.filter(c => !c.parentId);
        const sorted = [...rootComments].sort((a, b) => (b.upvotes - b.downvotes) - (a.upvotes - a.downvotes));
        return {
            visibleComments: sorted.slice(0, 2),
            totalComments: sorted.length
        };
    }, [topic.comments]);

    const totalTopicVotes = topic.credibleVotes + topic.controversialVotes;
    const crediblePercentage = totalTopicVotes > 0
        ? Math.round((topic.credibleVotes / totalTopicVotes) * 100)
        : 0;
    const controversialPercentage = totalTopicVotes > 0 ? 100 - crediblePercentage : 0;
    const totalPollVotes = topic.options?.reduce((acc, opt) => acc + opt.voteCount, 0) || 0;

    const noteColorClass = CATEGORY_STYLES[topic.category] || 'bg-yellow-100 text-yellow-900';

    return (
        <div
            onClick={() => onOpenDetail(topic)}
            className={`relative ${noteColorClass} rounded-sm shadow-[3px_3px_10px_rgba(0,0,0,0.2)] mb-8 transition-all hover:-translate-y-1 hover:shadow-[8px_8px_20px_rgba(0,0,0,0.3)] duration-300 cursor-pointer group h-full flex flex-col`}
        >

            {/* 📌 The Pin Visual */}
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10 drop-shadow-md">
                <div className="w-4 h-4 rounded-full bg-red-600 border-2 border-red-800 shadow-inner"></div>
                <div className="w-0.5 h-3 bg-gray-400 mx-auto -mt-1 opacity-50"></div>
            </div>

            <div className="p-5 pt-7 flex-1 flex flex-col">
                <div className="flex items-center justify-between mb-2">
                    <span className="font-hand font-bold text-sm tracking-wide opacity-70 uppercase">
                        {CATEGORY_NAMES[topic.category]}
                    </span>
                    <div className="flex items-center gap-2 relative z-20">
                        <span className="text-xs opacity-60">
                            {new Date(topic.timestamp).toLocaleDateString('zh-TW')}
                        </span>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                currentUser ? onToggleFavorite(topic.id) : alert('請先登入');
                            }}
                            className={`transition-transform hover:scale-110 ${topic.isFavorite ? 'text-rose-500' : 'text-gray-400 hover:text-rose-400'}`}
                        >
                            <Heart size={18} className={topic.isFavorite ? 'fill-current' : ''} />
                        </button>
                    </div>
                </div>

                {/* Handwritten Title */}
                <h3 className="font-hand text-2xl font-bold mb-3 leading-snug break-words flex-1">
                    {topic.title}
                </h3>

                {/* --- Card Content Box (White paper on top of sticky note) --- */}
                <div className="bg-white/60 backdrop-blur-sm rounded-lg p-3 shadow-sm border border-white/40 mt-auto">

                    {/* Poll or Discussion UI */}
                    {topic.type === 'discussion' && (
                        <div className="mb-3">
                            <div className="flex items-center justify-between mb-1">
                                <h4 className="text-xs font-bold opacity-70 flex items-center gap-1">
                                    <HelpCircle size={12} /> 性質評估
                                </h4>
                                <span className="text-[10px] opacity-60">{totalTopicVotes} 票</span>
                            </div>

                            <div className="relative w-full h-1.5 bg-gray-200/50 rounded-full overflow-hidden mb-2 flex">
                                {totalTopicVotes === 0 ? (
                                    <div className="w-full h-full"></div>
                                ) : (
                                    <>
                                        <div className="h-full bg-blue-500/80" style={{ width: `${crediblePercentage}%` }} />
                                        <div className="h-full bg-purple-500/80" style={{ width: `${controversialPercentage}%` }} />
                                    </>
                                )}
                            </div>
                        </div>
                    )}

                    {topic.type === 'poll' && topic.options && (
                        <div className="mb-3">
                            <h4 className="text-xs font-bold opacity-70 mb-1 flex items-center gap-1"><BarChart3 size={12} /> 投票 ({totalPollVotes})</h4>
                            <div className="space-y-1">
                                {topic.options.slice(0, 2).map(option => {
                                    const percent = totalPollVotes > 0 ? Math.round((option.voteCount / totalPollVotes) * 100) : 0;
                                    return (
                                        <div key={option.id} className="w-full relative h-6 rounded border border-gray-200/50 overflow-hidden text-left">
                                            <div className="absolute top-0 left-0 bottom-0 bg-blue-200/50" style={{ width: `${percent}%` }} />
                                            <div className="absolute inset-0 flex items-center justify-between px-2">
                                                <span className="text-[10px] font-medium truncate pr-2 z-10">{option.text}</span>
                                                <span className="text-[10px] font-bold z-10">{percent}%</span>
                                            </div>
                                        </div>
                                    );
                                })}
                                {topic.options.length > 2 && <div className="text-[10px] text-center opacity-60">...還有 {topic.options.length - 2} 個選項</div>}
                            </div>
                        </div>
                    )}

                    {/* AI Analysis (Indicator) */}
                    {topic.aiAnalysis && (
                        <div className="mb-2 flex items-center gap-1 text-[10px] font-bold text-indigo-700/80">
                            <Sparkles size={10} /> 已有 AI 分析
                        </div>
                    )}

                    {/* Comments Preview (Read Only) */}
                    <div className="border-t border-gray-200/50 pt-2 space-y-2">
                        {visibleComments.map((comment) => (
                            <div key={comment.id} className="text-xs">
                                <div className="flex justify-between items-baseline mb-0.5">
                                    <span className="font-bold opacity-80 truncate max-w-[80px]">{comment.authorName}</span>
                                    <span className="flex items-center gap-0.5 text-[10px] opacity-50"><ThumbsUp size={8} /> {comment.upvotes}</span>
                                </div>
                                <p className="opacity-90 line-clamp-1 leading-tight">{comment.content}</p>
                            </div>
                        ))}
                        {visibleComments.length === 0 && <p className="text-[10px] text-center opacity-50">尚無留言</p>}
                    </div>

                    <div className="mt-2 pt-2 border-t border-gray-200/50 text-center">
                        <button className="text-[10px] font-bold opacity-70 group-hover:text-blue-600 group-hover:opacity-100 flex items-center justify-center gap-1 w-full">
                            <Maximize2 size={10} />
                            {totalComments > 0 ? `查看全部 ${totalComments} 則留言` : '查看詳情與留言'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};