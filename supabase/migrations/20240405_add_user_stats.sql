-- Table pour les statistiques utilisateur
CREATE TABLE user_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  total_conversations integer DEFAULT 0,
  total_messages_sent integer DEFAULT 0,
  total_messages_received integer DEFAULT 0,
  models_used jsonb DEFAULT '{}',
  last_activity timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id)
);

-- Table pour les prompts favoris
CREATE TABLE favorite_prompts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  prompt_id uuid REFERENCES prompts NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, prompt_id)
);

-- Table pour les conversations favorites
CREATE TABLE favorite_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  conversation_id uuid REFERENCES chat_history NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, conversation_id)
);

-- Enable RLS
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorite_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorite_conversations ENABLE ROW LEVEL SECURITY;

-- Policies for user_stats
CREATE POLICY "Users can view their own stats"
  ON user_stats FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "System can manage user stats"
  ON user_stats FOR ALL
  TO postgres
  USING (true)
  WITH CHECK (true);

-- Policies for favorite_prompts
CREATE POLICY "Users can manage their favorite prompts"
  ON favorite_prompts FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policies for favorite_conversations
CREATE POLICY "Users can manage their favorite conversations"
  ON favorite_conversations FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Function to update user stats when a message is sent/received
CREATE OR REPLACE FUNCTION update_user_stats()
RETURNS trigger AS $$
DECLARE
  messages jsonb;
  user_messages integer := 0;
  assistant_messages integer := 0;
  model_used text;
BEGIN
  -- Parse messages JSON
  messages := NEW.messages::jsonb;
  
  -- Count messages by role
  SELECT 
    COUNT(*) FILTER (WHERE value->>'role' = 'user'),
    COUNT(*) FILTER (WHERE value->>'role' = 'assistant')
  INTO user_messages, assistant_messages
  FROM jsonb_array_elements(messages);
  
  -- Get the model used (assuming it's stored somewhere in the chat)
  model_used := 'default_model'; -- Update this based on your actual model storage
  
  -- Update or insert user stats
  INSERT INTO user_stats (
    user_id,
    total_conversations,
    total_messages_sent,
    total_messages_received,
    models_used
  )
  VALUES (
    NEW.user_id,
    1,
    user_messages,
    assistant_messages,
    jsonb_build_object(model_used, 1)
  )
  ON CONFLICT (user_id)
  DO UPDATE SET
    total_conversations = user_stats.total_conversations + 1,
    total_messages_sent = user_stats.total_messages_sent + user_messages,
    total_messages_received = user_stats.total_messages_received + assistant_messages,
    models_used = jsonb_set(
      COALESCE(user_stats.models_used, '{}'::jsonb),
      array[model_used],
      (COALESCE((user_stats.models_used->>model_used)::integer, 0) + 1)::text::jsonb
    ),
    last_activity = now();
    
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for updating stats on new chat
CREATE TRIGGER update_stats_on_chat
  AFTER INSERT OR UPDATE ON chat_history
  FOR EACH ROW
  EXECUTE FUNCTION update_user_stats(); 