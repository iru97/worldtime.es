/*
  # Add contact groups feature

  1. New Tables
    - `contact_groups`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `name` (text, required)
      - `color` (text, optional - hex color code)
      - `created_at` (timestamp)

  2. Changes
    - Add `group_id` column to contacts table
    - Add foreign key constraint

  3. Security
    - Enable RLS on contact_groups table
    - Add policies for CRUD operations
*/

-- Create contact_groups table
CREATE TABLE IF NOT EXISTS public.contact_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  color text DEFAULT '#3B82F6',
  created_at timestamptz DEFAULT now()
);

-- Add group_id to contacts table
DO $$ BEGIN
  ALTER TABLE public.contacts
    ADD COLUMN group_id uuid REFERENCES public.contact_groups(id) ON DELETE SET NULL;
EXCEPTION
  WHEN duplicate_column THEN NULL;
END $$;

-- Enable RLS
ALTER TABLE public.contact_groups ENABLE ROW LEVEL SECURITY;

-- Create policies for contact_groups
DO $$ BEGIN
  CREATE POLICY "Users can view own groups"
    ON public.contact_groups
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can create own groups"
    ON public.contact_groups
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can update own groups"
    ON public.contact_groups
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can delete own groups"
    ON public.contact_groups
    FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS contact_groups_user_id_idx ON public.contact_groups(user_id);
CREATE INDEX IF NOT EXISTS contacts_group_id_idx ON public.contacts(group_id);
