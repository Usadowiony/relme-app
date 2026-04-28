-- Zadanie 3: Poprawa relacji
ALTER TABLE public.questions DROP CONSTRAINT IF EXISTS questions_media_id_fkey;
ALTER TABLE public.questions ADD CONSTRAINT questions_media_id_fkey FOREIGN KEY (media_id) REFERENCES public.media_assets(id) ON DELETE SET NULL;

-- Zadanie 1: Atomowy zapis pytań
CREATE OR REPLACE FUNCTION public.save_question_with_answers_rpc(payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_question_id uuid;
    v_media_id uuid;
    v_existing_media_id uuid;
    v_answer jsonb;
    v_tag jsonb;
    v_answer_id uuid;
    v_existing_answers uuid[];
    v_payload_answer_ids uuid[];
BEGIN
    -- Extract or handle media
    IF payload->'question'->>'media_url' IS NOT NULL THEN
        SELECT id INTO v_existing_media_id FROM public.media_assets WHERE file_url = payload->'question'->>'media_url' LIMIT 1;
        IF v_existing_media_id IS NOT NULL THEN
            v_media_id := v_existing_media_id;
        ELSE
            INSERT INTO public.media_assets (file_url) VALUES (payload->'question'->>'media_url') RETURNING id INTO v_media_id;
        END IF;
    END IF;

    -- Upsert question
    IF payload->>'questionId' IS NOT NULL THEN
        v_question_id := (payload->>'questionId')::uuid;
        UPDATE public.questions SET
            content = payload->'question'->>'content',
            question_type = payload->'question'->>'question_type',
            media_id = v_media_id
        WHERE id = v_question_id;
    ELSE
        INSERT INTO public.questions (content, question_type, media_id)
        VALUES (
            payload->'question'->>'content',
            payload->'question'->>'question_type',
            v_media_id
        ) RETURNING id INTO v_question_id;
    END IF;

    -- Handle answers
    -- get existing answer ids
    SELECT array_agg(id) INTO v_existing_answers FROM public.answers WHERE question_id = v_question_id;
    
    -- extract payload answer ids
    SELECT array_agg((a->>'id')::uuid) INTO v_payload_answer_ids
    FROM jsonb_array_elements(payload->'answers') a
    WHERE a->>'id' IS NOT NULL;

    -- delete answers not in payload
    IF v_existing_answers IS NOT NULL THEN
        DELETE FROM public.answers WHERE question_id = v_question_id AND id = ANY(v_existing_answers) AND (v_payload_answer_ids IS NULL OR NOT (id = ANY(v_payload_answer_ids)));
    END IF;

    -- loop answers
    FOR v_answer IN SELECT * FROM jsonb_array_elements(payload->'answers')
    LOOP
        IF v_answer->>'id' IS NOT NULL THEN
            v_answer_id := (v_answer->>'id')::uuid;
            UPDATE public.answers SET content = v_answer->>'content' WHERE id = v_answer_id;
        ELSE
            INSERT INTO public.answers (question_id, content) VALUES (v_question_id, v_answer->>'content') RETURNING id INTO v_answer_id;
        END IF;

        -- delete existing tags for this answer
        DELETE FROM public.answer_tags WHERE answer_id = v_answer_id;

        -- insert new tags
        IF jsonb_typeof(v_answer->'tags') = 'array' THEN
            FOR v_tag IN SELECT * FROM jsonb_array_elements(v_answer->'tags')
            LOOP
                INSERT INTO public.answer_tags (answer_id, tag_id, points)
                VALUES (v_answer_id, (v_tag->>'tag_id')::uuid, COALESCE((v_tag->>'points')::int, 0));
            END LOOP;
        END IF;
    END LOOP;

    RETURN jsonb_build_object('question_id', v_question_id);
EXCEPTION
    WHEN OTHERS THEN
        RAISE;
END;
$$;

-- Zadanie 2: Bezpieczna Publikacja
CREATE OR REPLACE FUNCTION public.publish_quiz_version_rpc(target_version_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.quiz_versions SET status = 'archived' WHERE status = 'live';
    UPDATE public.quiz_versions SET status = 'live', published_at = now() WHERE id = target_version_id;
EXCEPTION
    WHEN OTHERS THEN
        RAISE;
END;
$$;
