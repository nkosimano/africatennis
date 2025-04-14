-- Add role column to profiles if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND column_name = 'role'
  ) THEN
    ALTER TABLE profiles ADD COLUMN role text DEFAULT 'user';
  END IF;
END $$;

-- Create function to manage admin roles
CREATE OR REPLACE FUNCTION manage_admin_role(target_user_id uuid, should_be_admin boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if the executing user is an admin
  IF NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only administrators can manage admin roles';
  END IF;

  -- Update the target user's role
  UPDATE profiles
  SET role = CASE WHEN should_be_admin THEN 'admin' ELSE 'user' END
  WHERE id = target_user_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION manage_admin_role TO authenticated;

-- Create initial admin (replace 'ADMIN_USER_ID' with the actual UUID of your admin user)
-- Uncomment and modify this when you want to create your first admin
-- UPDATE profiles SET role = 'admin' WHERE id = 'ADMIN_USER_ID'; 