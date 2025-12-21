export enum Category {
  POLITICS = 'Politics',
  ECONOMICS = 'Economics',
  HEALTH = 'Health',
  TECHNOLOGY = 'Technology'
}

export const CATEGORY_NAMES: Record<Category, string> = {
  [Category.POLITICS]: '政治與社會',
  [Category.ECONOMICS]: '經濟與理財',
  [Category.HEALTH]: '健康與醫療',
  [Category.TECHNOLOGY]: '科技與3C',
};

export type SortOption = 'newest' | 'hot' | 'controversial' | 'credible';
export type ViewMode = 'home' | 'all' | 'favorites' | 'category';

export interface User {
  id: string;
  username: string;
  avatar: string;
  email: string;
  level: 'trainee' | 'member' | 'expert' | 'moderator' | 'admin';
  reputation: number;
  loginCount: number;
}

export type CommentType = 'supplement' | 'refutation' | 'general';
export type CommentStance = 'support' | 'oppose' | 'neutral';

export interface Comment {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  content: string;
  upvotes: number;
  downvotes: number;
  timestamp: number;
  userVote?: 'up' | 'down'; // Track current user's vote
  parentId?: string; // For nested replies
  type: CommentType;
  stance: CommentStance;
  ipAddress?: string;
  country?: string;
  city?: string;
  region?: string;
}

export interface PollOption {
  id: string;
  text: string;
  voteCount: number;
}

export interface Topic {
  id: string;
  type: 'discussion' | 'poll';
  title: string;
  description: string;
  category: Category;
  authorName: string;
  timestamp: number;
  comments: Comment[];
  aiAnalysis?: string;
  isAnalyzing?: boolean;
  isFavorite?: boolean; // New: Is this topic in user's favorites?

  // Discussion Mode
  credibleVotes: number;
  controversialVotes: number;
  userTopicVote?: 'credible' | 'controversial';

  // Poll Mode
  options?: PollOption[];
  userPollVoteId?: string;
}