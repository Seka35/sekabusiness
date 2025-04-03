export interface Message {
  content: string;
  role: 'user' | 'assistant';
  timestamp?: string;
}

export interface ChatHistory {
  id: string;
  title: string;
  last_message: string;
  created_at: string;
  messages?: Message[];
} 