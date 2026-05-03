-- Utworzenie tabel dla wyników
CREATE TABLE IF NOT EXISTS quiz_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  version_id UUID REFERENCES quiz_versions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ DEFAULT now()
);

-- RLS: Użytkownik widzi tylko swoje submisje
ALTER TABLE quiz_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Uzytkownik widzi swoje submisje"
  ON quiz_submissions FOR SELECT
  USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS submission_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID REFERENCES quiz_submissions(id) ON DELETE CASCADE,
  question_id UUID REFERENCES questions(id) ON DELETE SET NULL,
  selected_answer_ids UUID[] NOT NULL,
  snapshot JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS: Użytkownik widzi odpowiedzi do swoich submisji
ALTER TABLE submission_answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Uzytkownik widzi odpowiedzi swoich submisji"
  ON submission_answers FOR SELECT
  USING (
    submission_id IN (
      SELECT id FROM quiz_submissions WHERE user_id = auth.uid()
    )
  );

-- Bezpieczna procedura wysyłki (bez dziurawego argumentu user_uuid)
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
  -- 1. Pobieramy ID użytkownika BEZPOŚREDNIO z tokena sesji (odporne na hakerów)
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Brak autoryzacji. Użytkownik nie jest zalogowany.';
  END IF;

  -- 2. Sprawdzamy, czy użytkownik już nie ukończył quizu (blokada podwójnej wysyłki)
  SELECT quiz_completed INTO v_already_completed FROM public.profiles WHERE id = v_user_id;
  IF v_already_completed THEN
    RAISE EXCEPTION 'Użytkownik już ukończył quiz. Nie można wysłać ponownie.';
  END IF;

  -- 3. Tworzymy nowy rekord submisji
  INSERT INTO quiz_submissions (user_id, version_id, completed_at)
  VALUES (
    v_user_id,
    (payload->>'version_id')::UUID,
    now()
  )
  RETURNING id INTO new_submission_id;

  -- 4. Wstawianie poszczególnych odpowiedzi (iteracja po tablicy answers)
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

  -- 5. Aktualizacja profilu, by użytkownik miał status ukończonego quizu
  UPDATE public.profiles
  SET quiz_completed = true,
      updated_at = now()
  WHERE id = v_user_id;

  RETURN new_submission_id;

EXCEPTION
  WHEN OTHERS THEN
    RAISE; -- Wycofanie transakcji w przypadku błędu
END;
$$;

-- Zabezpieczenie przed wywołaniem przez anonimów
REVOKE EXECUTE ON FUNCTION submit_quiz_result_rpc(JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION submit_quiz_result_rpc(JSONB) TO authenticated;
