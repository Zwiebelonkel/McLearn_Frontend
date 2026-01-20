export type Stack = {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
  is_public: boolean;
  user_id: number;
  owner_name?: string;
  card_amount?: number;
  collaborators?: StackCollaborator[];
  average_rating?: number;
  rating_count?: number;
  user_rating?: number; // Current user's rating
};

export type Card = {
  id: string;
  stack_id: string;
  front: string;
  back: string;
  box: number;
  due_at: string;
  created_at: string;
  updated_at: string;
  front_image?: string;
};

export type StackCollaborator = {
  id: string;
  stack_id: string;
  user_id: number;
  user_name: string;
  can_edit: boolean;
};

export type User = {
  id: number;
  name: string;
};

export interface FriendRequest {
  id: number;
  sender_id: number;
  receiver_id: number;
  name: string;
}

export interface CardStatistics {
  id: string;
  front: string;
  back: string;
  review_count: number;
  hard_count?: number;
  easy_count?: number;
  box: number;
}

export interface BoxDistribution {
  box: number;
  count: number;
}

export interface ReviewActivity {
  date: string;
  review_count: number;
  again_count: number;
  hard_count: number;
  good_count: number;
  easy_count: number;
}

export interface StackStatistics {
  overall: {
    total_cards: number;
    average_box: number;
    total_reviews: number;
    total_again: number;
    total_hard: number;
    total_good: number;
    total_easy: number;
  };
  mostReviewed: CardStatistics[];
  hardestCards: CardStatistics[];
  easiestCards: CardStatistics[];
  boxDistribution: BoxDistribution[];
  recentActivity: ReviewActivity[];
}

export interface UserStatistics {
  overall: {
    total_stacks: number;
    total_cards: number;
    total_reviews: number;
    average_box: number;
    average_accuracy: number;
    total_again: number;
    total_hard: number;
    total_good: number;
    total_easy: number;
  };
  topStacks: {
    id: string;
    name: string;
    card_count: number;
    average_box: number;
    total_reviews: number;
  }[];
  mostReviewedStacks: {
    id: string;
    name: string;
    card_count: number;
    total_reviews: number;
  }[];
  studyStreak: {
    current_streak: number;
    longest_streak: number;
    last_study_date: string;
  } | null;
  recentActivity: {
    date: string;
    review_count: number;
    again_count: number;
    hard_count: number;
    good_count: number;
    easy_count: number;
  }[];
  boxDistribution: {
    box: number;
    count: number;
  }[];
  weeklyStats: {
    day_of_week: number; // 0 = Sunday, 1 = Monday, etc.
    review_count: number;
  }[];
  limited: boolean;
}