-- ============================================================
-- TYLKO NA CZAS TESTÓW: usuwa WSZYSTKIE moduły i wszystko, co z nimi związane.
-- Nie uruchamiać na produkcji z prawdziwymi użytkownikami.
--
-- Czyści: modules, module_drafts, module_versions (także opublikowane i archiwalne),
--         module_progress (postęp wszystkich użytkowników), module_poll_votes (głosy w sondażach).
-- Nie rusza: quizu, użytkowników, profili, biblioteki mediów (media_assets).
--
-- TRUNCATE nie odpala triggerów wierszowych, więc zabezpieczenia
-- „opublikowanego modułu nie da się usunąć” nie blokują czyszczenia –
-- i dalej działają normalnie dla zwykłego DELETE.
-- ============================================================

-- 1) Podgląd: co zostanie usunięte.
SELECT
  (SELECT count(*) FROM public.modules)           AS modules,
  (SELECT count(*) FROM public.module_versions)   AS versions,
  (SELECT count(*) FROM public.module_drafts)     AS drafts,
  (SELECT count(*) FROM public.module_progress)   AS progress,
  (SELECT count(*) FROM public.module_poll_votes) AS poll_votes;

-- 2) Czyszczenie (wszystkie tabele w jednym poleceniu, bo nawzajem się wskazują).
TRUNCATE TABLE
  public.module_poll_votes,
  public.module_progress,
  public.module_drafts,
  public.module_versions,
  public.modules;
