/*
  # Add email validation and security updates

  1. Changes
    - Add email validation constraints to profiles and contacts tables
    - Update security settings for functions
    - Add necessary permissions

  2. Security
    - Set SECURITY DEFINER on handle_new_user function
    - Grant proper permissions to roles
*/

-- Add email validation constraints
DO $$ BEGIN
  ALTER TABLE public.profiles
    ADD CONSTRAINT profiles_email_check 
    CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.contacts
    ADD CONSTRAINT contacts_email_check 
    CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Update handle_new_user function to be security definer
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (
    NEW.id,
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;