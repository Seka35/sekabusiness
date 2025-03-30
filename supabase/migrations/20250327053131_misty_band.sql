/*
  # Initial Schema Setup

  1. New Tables
    - `categories` - Tool categories
      - `id` (uuid, primary key)
      - `name` (text) - Category name
      - `slug` (text) - URL-friendly name
      - `created_at` (timestamp)
    
    - `tools` - Business tools
      - `id` (uuid, primary key)
      - `name` (text) - Tool name
      - `description` (text) - Tool description
      - `category_id` (uuid) - Reference to categories
      - `subcategory` (text) - Subcategory name
      - `logo_url` (text) - Tool logo URL
      - `website_link` (text) - Official website
      - `affiliate_link` (text, optional) - Affiliate link
      - `price_type` (text) - Price type
      - `price` (text) - Price
      - `created_at` (timestamp)
    
    - `prompts` - Prompt library
      - `id` (uuid, primary key)
      - `title` (text) - Prompt title
      - `tool` (text) - Associated tool
      - `description` (text) - Prompt description
      - `prompt_text` (text) - The actual prompt
      - `created_at` (timestamp)
    
    - `blog_posts` - Blog articles
      - `id` (uuid, primary key)
      - `title` (text) - Post title
      - `content` (text) - Post content
      - `excerpt` (text) - Short description
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for public read access
    - Add policies for authenticated admin write access
*/

-- Categories Table
CREATE TABLE categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access on categories"
  ON categories FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow admin write access on categories"
  ON categories FOR ALL
  TO authenticated
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Tools Table
CREATE TABLE tools (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL,
  category_id uuid REFERENCES categories(id),
  subcategory text NOT NULL,
  logo_url text NOT NULL,
  website_link text NOT NULL,
  affiliate_link text,
  price_type text NOT NULL DEFAULT 'free' CHECK (price_type IN ('free', 'paid', 'freemium')),
  price text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE tools ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access on tools"
  ON tools FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow admin write access on tools"
  ON tools FOR ALL
  TO authenticated
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Prompts Table
CREATE TABLE prompts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  tool text NOT NULL,
  description text NOT NULL,
  prompt_text text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE prompts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access on prompts"
  ON prompts FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow admin write access on prompts"
  ON prompts FOR ALL
  TO authenticated
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Blog Posts Table
CREATE TABLE blog_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  excerpt text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access on blog_posts"
  ON blog_posts FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow admin write access on blog_posts"
  ON blog_posts FOR ALL
  TO authenticated
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Subscriptions Table
CREATE TABLE subscriptions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  status text check (status in ('active', 'inactive')) not null,
  current_period_end timestamp with time zone not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Créer une policy pour que les utilisateurs ne puissent voir que leur propre abonnement
CREATE POLICY "Users can view own subscription"
  ON subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- Créer une policy pour que seul le système puisse modifier les abonnements
CREATE POLICY "System can insert/update subscriptions"
  ON subscriptions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);