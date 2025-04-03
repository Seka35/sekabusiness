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
    name: string;
    slug: string;
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
  category_id: string;
  subcategory: string;
  price_type: 'free' | 'freemium' | 'paid';
  price?: string;
  logo_url?: string;
  website_link?: string;
  affiliate_link?: string;
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