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
}