export interface Message {
  content: string;
  role: 'user' | 'assistant' | 'system';
  timestamp?: string;
}

export interface ChatHistory {
  id: string;
  title: string;
  last_message: string;
  created_at: string;
  messages?: Message[];
}

export interface Prompt {
  id: string;
  title: string;
  description: string;
  prompt_text: string;
  tool: string;
  created_at?: string;
}

export interface Tool {
  id: string;
  name: string;
  description: string;
  category: string;
  created_at?: string;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  created_at?: string;
} 