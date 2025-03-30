-- Create admins table
CREATE TABLE admins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- Allow admins to read the admins table
CREATE POLICY "Admins can read admins"
  ON admins FOR SELECT
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT user_id FROM admins
    )
  );

-- Allow system to manage admins
CREATE POLICY "System can manage admins"
  ON admins FOR ALL
  TO postgres
  USING (true)
  WITH CHECK (true);

-- Insert initial admin (replace 'ADMIN_USER_ID' with the actual user ID after creating the first admin account)
-- INSERT INTO admins (user_id) VALUES ('ADMIN_USER_ID'); 