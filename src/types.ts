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

export interface BlogPost {
  id: string;
  title: string;
  content: string;
  description: string;
  excerpt: string;
  image_url?: string;
  category_id: string;
  subcategory?: string;
  created_at?: string;
  updated_at?: string;
  published?: boolean;
  slug: string;
  categories?: {
    id: string;
    name: string;
    slug: string;
    description?: string;
  };
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
  logo_url?: string;
  website_link: string;
  url?: string;
  price_type: string;
  category_id: string;
  subcategory?: string;
  created_at?: string;
  categories?: {
    id: string;
    name: string;
    slug: string;
  };
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  created_at?: string;
  slug?: string;
}

export interface User {
  id: string;
  email: string;
  created_at: string;
  subscription_status: 'active' | 'inactive' | 'cancelled';
  last_login: string | null;
  current_period_end?: string;
}

export interface ChatMessage {
  id: string;
  user_id: string;
  messages: string;
  created_at: string;
  email: string;
}

export interface ParsedMessage {
  role: string;
  content: string;
  timestamp: string;
} 