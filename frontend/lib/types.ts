export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  preferred_language: string;
  preferred_difficulty: string;
  memory_enabled: boolean;
  created_at: string;
}

export interface ModelInfo {
  id: string;
  name: string;
  provider: string;
  status?: string;
}

export interface MessageItem {
  id?: string;
  role: "system" | "user" | "assistant";
  content: string;
  created_at?: string;
}

export interface ConversationItem {
  id: string;
  title: string;
  model: string;
  created_at: string;
  updated_at: string;
  messages?: MessageItem[];
}

export interface LearningMaterialItem {
  id: string;
  subject_id?: string;
  title: string;
  filename: string;
  file_type: string;
  file_size: number;
  status: string;
  summary?: string;
  key_concepts?: string;
  created_at: string;
}

export interface NoteItem {
  id: string;
  material_id?: string;
  title: string;
  content: string;
  tags?: string;
  created_at: string;
  updated_at: string;
}

export interface QuizQuestionItem {
  id: string;
  order_index: number;
  question_type: string;
  question_text: string;
  options?: string[];
}

export interface QuizItem {
  id: string;
  subject: string;
  topic: string;
  difficulty: string;
  question_count: number;
  time_limit_minutes?: number;
  created_at: string;
  last_score?: number;
  attempts_count?: number;
  questions?: QuizQuestionItem[];
}

export interface QuizPublicResponse extends QuizItem {
  questions: QuizQuestionItem[];
}

export interface QuizAnswerReviewItem {
  question_id: string;
  question_text: string;
  question_type: string;
  options?: string[];
  user_answer: string;
  correct_answer: string;
  is_correct: boolean;
  explanation?: string;
  ai_feedback?: string;
}

export interface QuizAttemptResult {
  id: string;
  quiz_id: string;
  score: number;
  max_score: number;
  percentage: number;
  total_questions: number;
  correct_count: number;
  completed_at: string;
  answers: QuizAnswerReviewItem[];
}

export interface ReviewCardItem {
  id: string;
  subject: string;
  topic?: string;
  question: string;
  answer: string;
  explanation?: string;
  difficulty_level: string;
  repetitions: number;
  interval_days: number;
  ease_factor: number;
  next_review_at: string;
  last_reviewed_at?: string;
  failure_count: number;
  created_at: string;
}

export interface StudyGoalItem {
  id: string;
  title: string;
  description?: string;
  target_date?: string;
  status: string;
  progress_percentage: number;
  created_at: string;
}

export interface StudyTaskItem {
  id: string;
  goal_id?: string;
  title: string;
  subject?: string;
  duration_minutes: number;
  due_date?: string;
  is_completed: boolean;
  completed_at?: string;
  created_at: string;
}

export interface UserMemoryItem {
  id: string;
  category: "preference" | "weakness" | "goal" | "topic_interest" | "habit";
  key: string;
  value: string;
  created_at: string;
  updated_at: string;
}

export interface AnalyticsOverview {
  total_study_minutes: number;
  total_sessions_count: number;
  average_quiz_score: number;
  quizzes_taken_count: number;
  cards_due_for_review: number;
  total_cards_count: number;
  study_goals_active: number;
  study_goals_completed: number;
  weekly_study_trends: {
    day: string;
    date: string;
    minutes: number;
  }[];
  accuracy_by_subject: {
    subject: string;
    accuracy_percentage: number;
    total_quizzes: number;
  }[];
  weak_topics: {
    topic: string;
    subject: string;
    failure_count: number;
  }[];
  consistency_score: number;
  recommendations: string[];
}
