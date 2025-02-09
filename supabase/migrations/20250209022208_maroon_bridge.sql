/*
  # Add delete user function

  1. New Functions
    - `delete_user`: Stored function to safely delete a user's account and all associated data
  
  2. Security
    - Function is only accessible to authenticated users
    - Users can only delete their own account
*/

CREATE OR REPLACE FUNCTION public.delete_user()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete user's contacts (RLS will ensure only user's own contacts are deleted)
  DELETE FROM public.contacts WHERE user_id = auth.uid();
  
  -- Delete user's profile
  DELETE FROM public.profiles WHERE id = auth.uid();
  
  -- Delete user's auth account
  DELETE FROM auth.users WHERE id = auth.uid();
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.delete_user() TO authenticated;