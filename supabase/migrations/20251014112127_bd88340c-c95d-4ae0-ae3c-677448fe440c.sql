-- Create enum for app roles
CREATE TYPE public.app_role AS ENUM ('superadmin', 'admin', 'moderator', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create function to check if user is superadmin
CREATE OR REPLACE FUNCTION public.is_superadmin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'superadmin'
  )
$$;

-- RLS Policies for user_roles
-- Only superadmins can view roles
CREATE POLICY "Superadmins can view all roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (public.is_superadmin(auth.uid()));

-- Only superadmins can insert roles (but only through SQL, not through API)
CREATE POLICY "Superadmins can insert roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (public.is_superadmin(auth.uid()));

-- Only superadmins can update roles
CREATE POLICY "Superadmins can update roles"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (public.is_superadmin(auth.uid()));

-- Only superadmins can delete roles
CREATE POLICY "Superadmins can delete roles"
ON public.user_roles
FOR DELETE
TO authenticated
USING (public.is_superadmin(auth.uid()));

-- Add trigger to update updated_at
CREATE TRIGGER update_user_roles_updated_at
BEFORE UPDATE ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create table for banned users
CREATE TABLE public.banned_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    banned_by UUID REFERENCES auth.users(id) NOT NULL,
    reason TEXT,
    banned_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    unbanned_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS on banned_users
ALTER TABLE public.banned_users ENABLE ROW LEVEL SECURITY;

-- RLS Policies for banned_users
CREATE POLICY "Superadmins can view banned users"
ON public.banned_users
FOR SELECT
TO authenticated
USING (public.is_superadmin(auth.uid()));

CREATE POLICY "Superadmins can manage banned users"
ON public.banned_users
FOR ALL
TO authenticated
USING (public.is_superadmin(auth.uid()))
WITH CHECK (public.is_superadmin(auth.uid()));

-- Update projects table RLS to allow superadmins to view all projects
CREATE POLICY "Superadmins can view all projects"
ON public.projects
FOR SELECT
TO authenticated
USING (public.is_superadmin(auth.uid()));

CREATE POLICY "Superadmins can update all projects"
ON public.projects
FOR UPDATE
TO authenticated
USING (public.is_superadmin(auth.uid()));

-- Update user_subscriptions RLS to allow superadmins
CREATE POLICY "Superadmins can view all subscriptions"
ON public.user_subscriptions
FOR SELECT
TO authenticated
USING (public.is_superadmin(auth.uid()));

CREATE POLICY "Superadmins can manage all subscriptions"
ON public.user_subscriptions
FOR ALL
TO authenticated
USING (public.is_superadmin(auth.uid()))
WITH CHECK (public.is_superadmin(auth.uid()));

-- Update user_profiles RLS to allow superadmins
CREATE POLICY "Superadmins can view all profiles"
ON public.user_profiles
FOR SELECT
TO authenticated
USING (public.is_superadmin(auth.uid()));

CREATE POLICY "Superadmins can update all profiles"
ON public.user_profiles
FOR UPDATE
TO authenticated
USING (public.is_superadmin(auth.uid()));