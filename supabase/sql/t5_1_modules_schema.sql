-- ============================================================
-- T5.1a: Moduły Wiedzy — Schema, RLS, RPC
-- Migracja SQL do uruchomienia w Supabase SQL Editor
-- ============================================================

-- ============================================================
-- 1. TABELA: modules
-- ============================================================

CREATE TABLE IF NOT EXISTS public.modules (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title           TEXT NOT NULL,
  description     TEXT,
  cover_media_id  UUID REFERENCES public.media_assets(id) ON DELETE SET NULL,
  status          TEXT NOT NULL DEFAULT 'draft'
                    CHECK (status IN ('draft', 'published', 'archived')),
  flow_data       JSONB NOT NULL DEFAULT '{
    "schema_version": 1,
    "entry_node_id": "",
    "nodes": [],
    "edges": []
  }'::jsonb,
  created_by      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.modules IS 'Moduły Wiedzy — kontenery bloków edukacyjnych z grafem flow (DAG).';
COMMENT ON COLUMN public.modules.flow_data IS 'Skierowany acykliczny graf (DAG) bloków: { schema_version, entry_node_id, nodes[], edges[] }.';
COMMENT ON COLUMN public.modules.status IS 'Cykl życia: draft → published → archived. Tylko jeden published na raz.';

-- ============================================================
-- 2. TABELA: module_progress (postęp użytkownika)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.module_progress (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module_id       UUID NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  current_node_id TEXT NOT NULL,
  completed_at    TIMESTAMPTZ,
  collected_tags  JSONB DEFAULT '{}'::jsonb,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, module_id)
);

COMMENT ON TABLE public.module_progress IS 'Postęp użytkownika w danym module — bieżący węzeł i zebrane tagi.';
COMMENT ON COLUMN public.module_progress.current_node_id IS 'ID węzła w flow_data grafu JSON — wskaźnik pozycji użytkownika.';
COMMENT ON COLUMN public.module_progress.collected_tags IS 'Placeholder dla profilowania (T5.4): { tag_slug: total_points }.';

-- ============================================================
-- 3. RLS: modules
-- ============================================================

ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;

-- Odczyt: uwierzytelnieni użytkownicy widzą opublikowane moduły
CREATE POLICY modules_select_published ON public.modules
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND status = 'published'
  );

-- Pełny dostęp: admin (SELECT/INSERT/UPDATE/DELETE)
CREATE POLICY modules_admin_all ON public.modules
  FOR ALL
  USING (public.has_role('admin'))
  WITH CHECK (public.has_role('admin'));

-- ============================================================
-- 4. RLS: module_progress
-- ============================================================

ALTER TABLE public.module_progress ENABLE ROW LEVEL SECURITY;

-- Użytkownik widzi i modyfikuje tylko swój postęp
CREATE POLICY module_progress_owner_select ON public.module_progress
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY module_progress_owner_insert ON public.module_progress
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY module_progress_owner_update ON public.module_progress
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Admin: pełen podgląd postępów wszystkich użytkowników (read-only)
CREATE POLICY module_progress_admin_select ON public.module_progress
  FOR SELECT
  USING (public.has_role('admin'));

-- ============================================================
-- 5. RPC: save_module_flow_rpc
-- Atomowy zapis grafu flow_data dla modułu w statusie draft.
-- Tylko admin.
-- PERFORMANCE NOTE: Każde wywołanie przesyła cały obiekt JSONB.
-- Akceptowalne dla MVP. Dla dużych modułów (50+ węzłów) rozważyć
-- w przyszłości zapis różnicowy (JSON Patch RFC 6902).
-- ============================================================

CREATE OR REPLACE FUNCTION public.save_module_flow_rpc(
  p_module_id UUID,
  p_flow_data JSONB
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Sprawdzenie roli
  IF NOT public.has_role('admin') THEN
    RAISE EXCEPTION 'Brak uprawnień administratora.';
  END IF;

  -- Sprawdzenie czy moduł istnieje i ma status draft
  IF NOT EXISTS (
    SELECT 1 FROM public.modules
    WHERE id = p_module_id AND status = 'draft'
  ) THEN
    RAISE EXCEPTION 'Moduł nie istnieje lub nie jest w trybie draft.';
  END IF;

  -- Atomowy update
  -- PERFORMANCE NOTE: Zapisujemy cały graf przy każdym wywołaniu.
  -- MVP-akceptowalne. Przyszła optymalizacja: JSON Patch (różnicowy zapis).
  UPDATE public.modules
  SET
    flow_data = p_flow_data,
    updated_at = now()
  WHERE id = p_module_id;

EXCEPTION WHEN OTHERS THEN
  RAISE;
END;
$$;

-- ============================================================
-- 6. RPC: publish_module_rpc
-- Atomowe przejście: draft → published.
-- Poprzednio opublikowany moduł → archived.
-- Tylko admin.
-- ============================================================

CREATE OR REPLACE FUNCTION public.publish_module_rpc(
  p_module_id UUID
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Sprawdzenie roli
  IF NOT public.has_role('admin') THEN
    RAISE EXCEPTION 'Brak uprawnień administratora.';
  END IF;

  -- Sprawdzenie czy moduł jest draftem
  IF NOT EXISTS (
    SELECT 1 FROM public.modules
    WHERE id = p_module_id AND status = 'draft'
  ) THEN
    RAISE EXCEPTION 'Moduł nie istnieje lub nie jest w trybie draft.';
  END IF;

  -- Archiwizuj aktualnie opublikowany (jeśli istnieje)
  UPDATE public.modules
  SET status = 'archived', updated_at = now()
  WHERE status = 'published';

  -- Publikuj wybrany draft
  UPDATE public.modules
  SET status = 'published', updated_at = now()
  WHERE id = p_module_id;

EXCEPTION WHEN OTHERS THEN
  RAISE;
END;
$$;

-- ============================================================
-- 7. RPC: upsert_module_progress_rpc
-- Aktualizacja postępu użytkownika — IDOR-safe (auth.uid()).
-- Używane przez mobilkę.
-- ============================================================

CREATE OR REPLACE FUNCTION public.upsert_module_progress_rpc(
  p_module_id UUID,
  p_current_node_id TEXT,
  p_tag_updates JSONB DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Brak zalogowanego użytkownika.';
  END IF;

  -- Sprawdzenie czy moduł istnieje i jest opublikowany
  IF NOT EXISTS (
    SELECT 1 FROM public.modules
    WHERE id = p_module_id AND status = 'published'
  ) THEN
    RAISE EXCEPTION 'Moduł nie istnieje lub nie jest opublikowany.';
  END IF;

  -- Upsert postępu
  INSERT INTO public.module_progress (
    user_id, module_id, current_node_id, collected_tags
  )
  VALUES (
    v_user_id, p_module_id, p_current_node_id, p_tag_updates
  )
  ON CONFLICT (user_id, module_id) DO UPDATE SET
    current_node_id = EXCLUDED.current_node_id,
    collected_tags = public.module_progress.collected_tags || p_tag_updates,
    updated_at = now();

EXCEPTION WHEN OTHERS THEN
  RAISE;
END;
$$;
