export interface Category {
  id: string;
  name: string;
  slug: string;
}

export interface Tool {
  id: string;
  name: string;
  description: string;
  category_id: string;
  categories?: {
    name: string;
    slug: string;
  };
  subcategory: string;
  logo_url: string;
  affiliate_link?: string;
  website_link: string;
  price_type: 'free' | 'paid' | 'freemium';
  price?: string;
  created_at: string;
  updated_at?: string;
}

export interface Prompt {
  id: string;
  title: string;
  description: string;
  prompt_text: string;
  tool: string;
  created_at: string;
  updated_at: string;
}

export interface BlogPost {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  email: string;
  created_at?: string;
  last_login?: string | null;
  subscription_status?: 'active' | 'inactive' | 'cancelled';
}

export interface N8nScript {
  id: string;
  title: string;
  description: string;
  file_url: string;
  created_at: string;
  updated_at: string;
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
}