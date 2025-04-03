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
  category_id: string;
  price_type: 'free' | 'freemium' | 'paid';
  logo_url?: string;
  website_link?: string;
  created_at?: string;
  categories?: {
    name: string;
    slug: string;
  };
}

export interface Category {
  id: string;
  name: string;
  description: string;
  created_at?: string;
  slug?: string;
} 