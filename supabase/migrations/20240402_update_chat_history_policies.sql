-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow admins to delete any chat" ON chat_history;
DROP POLICY IF EXISTS "Allow admins to view any chat" ON chat_history;

-- Enable RLS if not already enabled
ALTER TABLE chat_history ENABLE ROW LEVEL SECURITY;

-- Create a policy to allow admins to delete any chat history
CREATE POLICY "Allow admins to delete any chat" ON chat_history
    FOR DELETE 
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 
            FROM subscriptions s 
            WHERE s.user_id = auth.uid() 
            AND s.status = 'active'
        )
    );

-- Create a policy to allow admins to view any chat history
CREATE POLICY "Allow admins to view any chat" ON chat_history
    FOR SELECT 
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 
            FROM subscriptions s 
            WHERE s.user_id = auth.uid() 
            AND s.status = 'active'
        )
    ); 