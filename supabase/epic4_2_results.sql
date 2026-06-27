-- Zaktualizowanie tabeli quiz_submissions
ALTER TABLE quiz_submissions 
ADD COLUMN IF NOT EXISTS computed_result JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'unpaid';

-- Funkcja do wyliczania wyników na podstawie zapisanych tagów w submisji
CREATE OR REPLACE FUNCTION calculate_diagnostic_result(v_submission_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_result JSONB;
BEGIN
  WITH extracted_tags AS (
    SELECT 
      tag->>'tag_slug' as tag_slug,
      (tag->>'points')::numeric as points
    FROM submission_answers sa,
    jsonb_array_elements(sa.snapshot->'answers') as ans,
    jsonb_array_elements(ans->'tags') as tag
    WHERE sa.submission_id = v_submission_id
      AND (ans->>'answer_id')::uuid = ANY(sa.selected_answer_ids)
  ),
  aggregated_tags AS (
    SELECT tag_slug, SUM(points) as total_points
    FROM extracted_tags
    GROUP BY tag_slug
  ),
  relation_path AS (
    SELECT tag_slug, total_points
    FROM aggregated_tags
    WHERE tag_slug IN ('poznac-siebie', 'poznac-kogos', 'pielegnowac-relacje')
    ORDER BY total_points DESC
    LIMIT 1
  ),
  user_style AS (
    SELECT tag_slug, total_points
    FROM aggregated_tags
    WHERE tag_slug IN ('bezp-styl', 'lek-styl', 'unik-styl')
    ORDER BY total_points DESC
    LIMIT 1
  ),
  partner_style AS (
    SELECT tag_slug, total_points
    FROM aggregated_tags
    WHERE tag_slug IN ('part-bezp-styl', 'part-unik-styl', 'part-lek-styl')
    ORDER BY total_points DESC
    LIMIT 1
  )
  SELECT jsonb_build_object(
    'relation_path', (SELECT tag_slug FROM relation_path),
    'user_style', (SELECT tag_slug FROM user_style),
    'partner_style', (SELECT tag_slug FROM partner_style)
  ) INTO v_result;

  RETURN COALESCE(v_result, '{}'::jsonb);
END;
$$;

-- Aktualizacja submit_quiz_result_rpc aby wywoływać kalkulator od razu po submisji
CREATE OR REPLACE FUNCTION submit_quiz_result_rpc(payload JSONB)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_already_completed BOOLEAN;
  new_submission_id UUID;
  ans JSONB;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Brak autoryzacji. Użytkownik nie jest zalogowany.';
  END IF;

  SELECT quiz_completed INTO v_already_completed FROM public.profiles WHERE id = v_user_id;
  IF v_already_completed THEN
    RAISE EXCEPTION 'Użytkownik już ukończył quiz. Nie można wysłać ponownie.';
  END IF;

  INSERT INTO quiz_submissions (user_id, version_id, completed_at, payment_status)
  VALUES (
    v_user_id,
    (payload->>'version_id')::UUID,
    now(),
    'unpaid'
  )
  RETURNING id INTO new_submission_id;

  FOR ans IN SELECT * FROM jsonb_array_elements(payload->'answers')
  LOOP
    INSERT INTO submission_answers (
      submission_id,
      question_id,
      selected_answer_ids,
      snapshot
    )
    VALUES (
      new_submission_id,
      (ans->>'question_id')::UUID,
      (SELECT array_agg(x::text::uuid) FROM jsonb_array_elements_text(ans->'selected_answer_ids') x),
      ans->'snapshot'
    );
  END LOOP;

  -- Wyliczamy saturację i wynik (algorytm bazy danych)
  UPDATE quiz_submissions
  SET computed_result = calculate_diagnostic_result(new_submission_id)
  WHERE id = new_submission_id;

  UPDATE public.profiles
  SET quiz_completed = true,
      updated_at = now()
  WHERE id = v_user_id;

  RETURN new_submission_id;

EXCEPTION
  WHEN OTHERS THEN
    RAISE;
END;
$$;
