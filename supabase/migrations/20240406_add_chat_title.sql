-- Add title column to chat_history table
ALTER TABLE chat_history ADD COLUMN title TEXT;

-- Update existing rows to have a title
UPDATE chat_history
SET title = COALESCE(
  (SELECT m->>'content'
   FROM json_array_elements(messages::json) AS m
   WHERE m->>'role' = 'user'
   LIMIT 1
  ),
  'Nouvelle conversation'
); 