export enum Category {
  POLITICS = 'Politics',
  SCIENCE = 'Science',
  HISTORY = 'History',
  TECHNOLOGY = 'Technology',
  HEALTH = 'Health',
  ENVIRONMENT = 'Environment',
  ECONOMICS = 'Economics'
}

export const CATEGORY_NAMES: Record<Category, string> = {
  [Category.POLITICS]: '政治',
  [Category.SCIENCE]: '科學',
  [Category.HISTORY]: '歷史',
  [Category.TECHNOLOGY]: '科技',
  [Category.HEALTH]: '健康',
  [Category.ENVIRONMENT]: '環境',
  [Category.ECONOMICS]: '經濟',
};

export type SortOption = 'newest' | 'hot' | 'controversial' | 'credible';
export type ViewMode = 'home' | 'all' | 'favorites' | 'category';

export interface User {
  id: string;
  username: string;
  avatar: string;
  email: string;
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