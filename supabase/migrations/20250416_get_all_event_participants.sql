-- Migration to add a stored procedure for retrieving all event participants
-- This function bypasses RLS to ensure all participants are returned

-- Create the function to get all event participants for a specific event
CREATE OR REPLACE FUNCTION public.get_all_event_participants(event_id_param UUID)
RETURNS TABLE (
  id UUID,
  created_at TIMESTAMPTZ,
  event_id UUID,
  profile_id UUID,
  role TEXT,
  invitation_status TEXT,
  check_in_time TIMESTAMPTZ,
  score_confirmation_status TEXT,
  profile JSONB
) 
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ep.id,
    ep.created_at,
    ep.event_id,
    ep.profile_id,
    ep.role::TEXT,
    ep.invitation_status::TEXT,
    ep.check_in_time,
    ep.score_confirmation_status::TEXT,
    jsonb_build_object(
      'id', p.id,
      'full_name', p.full_name,
      'avatar_url', p.avatar_url,
      'username', p.username
    ) AS profile
  FROM 
    event_participants ep
  LEFT JOIN 
    profiles p ON ep.profile_id = p.id
  WHERE 
    ep.event_id = event_id_param;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_all_event_participants(UUID) TO authenticated;

-- Add comment explaining the function
COMMENT ON FUNCTION public.get_all_event_participants IS 'Gets all participants for a specific event, including their profile information, bypassing RLS restrictions';
