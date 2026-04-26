-- Epic T3: Roles & Security Hardening (RBAC)

-- 1. Utworzenie typu wyliczeniowego (Enum)
DO $$ BEGIN
    CREATE TYPE app_role AS ENUM ('user', 'mentor', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Utworzenie tabeli ról
CREATE TABLE IF NOT EXISTS public.user_roles (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 3. Włączenie RLS dla user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 4. Funkcja pomocnicza do sprawdzania ról z uprawnieniami (Security Definer)
-- Definiujemy ją przed politykami, by móc z niej skorzystać i uniknąć nieskończonej pętli.
-- Z ominięciem RLS, żeby unikać nieskończonych pętli w innych tabelach i samej tabeli user_roles.
CREATE OR REPLACE FUNCTION public.has_role(requested_role app_role)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = requested_role
  );
$$;

-- 5. Polityki RLS

-- Każdy (zalogowany) może odczytać SWOJĄ rolę
DROP POLICY IF EXISTS "Users can read own role" ON public.user_roles;
CREATE POLICY "Users can read own role" 
  ON public.user_roles FOR SELECT 
  TO authenticated
  USING (auth.uid() = user_id);

-- TYLKO ADMIN może zarządzać rolami (SELECT, INSERT, UPDATE, DELETE)
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;
CREATE POLICY "Admins can manage all roles" 
  ON public.user_roles FOR ALL 
  TO authenticated
  USING (public.has_role('admin'));

-- 6. Trigger nadający rolę "user" po rejestracji

CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, 'user')
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_assign_role ON auth.users;
CREATE TRIGGER on_auth_user_created_assign_role
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_role();
