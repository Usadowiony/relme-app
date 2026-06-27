CREATE OR REPLACE FUNCTION submit_quiz_result_rpc(payload JSONB)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_already_completed BOOLEAN;
  v_is_admin BOOLEAN;
  new_submission_id UUID;
  ans JSONB;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Brak autoryzacji. Użytkownik nie jest zalogowany.';
  END IF;

  -- Weryfikacja ról: pominięcie sprawdzania statusu dla adminów
  v_is_admin := public.has_role('admin');

  IF NOT v_is_admin THEN
    SELECT quiz_completed INTO v_already_completed FROM public.profiles WHERE id = v_user_id;
    IF v_already_completed THEN
      RAISE EXCEPTION 'Użytkownik już ukończył quiz. Nie można wysłać ponownie.';
    END IF;
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

  -- Wyliczamy saturację i wynik
  UPDATE quiz_submissions
  SET computed_result = calculate_diagnostic_result(new_submission_id)
  WHERE id = new_submission_id;

  -- Zapisanie w profilu faktu ukończenia quizu
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
