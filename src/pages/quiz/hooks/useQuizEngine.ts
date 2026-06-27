import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type { Question, LayoutItem, QuizVersion, QuizSubmissionPayload, SnapshotData } from '../../../types/quiz';

type AnswersState = Record<string, string[]>;

export function useQuizEngine(userId: string, version: QuizVersion | null, questions: Question[]) {
  const [history, setHistory] = useState<string[]>([]);
  const [answers, setAnswers] = useState<AnswersState>({});
  const [currentQuestionId, setCurrentQuestionId] = useState<string | null>(null);
  const [direction, setDirection] = useState<number>(1); // 1 = forward, -1 = backward

  const storageKey = version && userId ? `relme_quiz_progress_${userId}_${version.id}` : null;

  // Initialize from LocalStorage or Version
  useEffect(() => {
    if (!version || !storageKey) return;
    const saved = localStorage.getItem(storageKey);
    
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setHistory(parsed.history ?? []);
        setAnswers(parsed.answers ?? {});
        setCurrentQuestionId(parsed.currentQuestionId ?? version.layout_data[0]?.question_id ?? null);
      } catch (e) {
        console.error("Failed to parse saved quiz state", e);
        setCurrentQuestionId(version.layout_data[0]?.question_id ?? null);
      }
    } else {
      setCurrentQuestionId(version.layout_data[0]?.question_id ?? null);
    }
  }, [version, storageKey]);

  // Save to LocalStorage (debounced — RAM is instant, disk write delayed 300ms)
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingStateRef = useRef<{ history: string[]; answers: AnswersState; currentQuestionId: string | null } | null>(null);

  const flushToLocalStorage = useCallback(() => {
    if (!storageKey || !pendingStateRef.current) return;
    localStorage.setItem(storageKey, JSON.stringify(pendingStateRef.current));
    pendingStateRef.current = null;
  }, [storageKey]);

  // Flush pending writes on unmount / page unload
  useEffect(() => {
    const handleBeforeUnload = () => flushToLocalStorage();
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      flushToLocalStorage();
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [flushToLocalStorage]);

  const saveState = useCallback((newHistory: string[], newAnswers: AnswersState, newCurrentId: string | null) => {
    if (!version || !storageKey) return;
    setHistory(newHistory);
    setAnswers(newAnswers);
    setCurrentQuestionId(newCurrentId);

    // Buffer in RAM, schedule disk write
    pendingStateRef.current = {
      history: newHistory,
      answers: newAnswers,
      currentQuestionId: newCurrentId
    };
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(flushToLocalStorage, 300);
  }, [version, storageKey, flushToLocalStorage]);

  const clearSavedProgress = useCallback(() => {
    if (storageKey) {
      localStorage.removeItem(storageKey);
    }
  }, [storageKey]);

  // Pure helper — traverses the tree for a given answers snapshot
  const computeSequence = useCallback((currentAnswers: AnswersState): string[] => {
    if (!version) return [];
    const seq: string[] = [];

    function traverse(items: LayoutItem[]) {
      for (const item of items) {
        seq.push(item.question_id);
        const itemAnswers = currentAnswers[item.question_id];

        if (itemAnswers && itemAnswers.length > 0) {
          const takenPath = item.paths.find(p => itemAnswers.includes(p.answer_id));
          if (takenPath && takenPath.children.length > 0) {
            traverse(takenPath.children);
          }
        }
      }
    }

    traverse(version.layout_data);
    return seq;
  }, [version]);

  // Memoized sequence — recalculated only when `answers` or `version` change
  const sequence = useMemo(() => computeSequence(answers), [computeSequence, answers]);

  // Zapisanie odpowiedzi, bez przechodzenia dalej
  const handleAnswer = useCallback((questionId: string, selectedAnswerIds: string[]) => {
    const question = questions.find(q => q.id === questionId);
    
    // Basic validation
    if (!question) return;
    if (question.question_type === 'single' && selectedAnswerIds.length > 1) {
      selectedAnswerIds = [selectedAnswerIds[0]];
    }
    if (question.question_type === 'multi' && selectedAnswerIds.length > 3) {
      selectedAnswerIds = selectedAnswerIds.slice(0, 3);
    }

    const newAnswers = { ...answers, [questionId]: selectedAnswerIds };
    saveState(history, newAnswers, currentQuestionId);
  }, [answers, history, currentQuestionId, saveState, questions]);

  // handleNext: explicit step forward (triggered by the "Dalej" button)
  const handleNext = useCallback(() => {
    if (!currentQuestionId) return;

    const seq = sequence;
    const currentIndex = seq.indexOf(currentQuestionId);
    const nextId = currentIndex >= 0 && currentIndex < seq.length - 1 ? seq[currentIndex + 1] : null;

    if (!nextId) return; // Guard: no next question available

    setDirection(1);
    const newHistory = [...history, currentQuestionId];
    saveState(newHistory, answers, nextId);
  }, [answers, history, currentQuestionId, saveState, sequence]);

  // MapsBack
  const handleBack = useCallback(() => {
    if (history.length === 0) return;
    
    setDirection(-1); // Mark as backward movement
    const newHistory = [...history];
    const prevId = newHistory.pop();
    
    if (prevId) {
      saveState(newHistory, answers, prevId);
    }
  }, [history, answers, saveState]);

  // 1. Dynamiczny, inteligentny mianownik (Zastępuje stare maxTotalQuestions i estimatedTotalQuestions)
  const estimatedTotalQuestions = useMemo(() => {
    if (!version || !version.layout_data) return 0;

    function getPossibleMaxDepth(items: LayoutItem[]): number {
      if (!items || items.length === 0) return 0;
      let maxLength = 0;
      
      for (const item of items) {
        maxLength += 1; // Liczymy obecne pytanie
        const itemAnswers = answers[item.question_id];

        if (itemAnswers && itemAnswers.length > 0) {
          // Użytkownik odpowiedział - idziemy TYLKO wybraną, rzeczywistą ścieżką
          const takenPath = item.paths?.find(p => itemAnswers.includes(p.answer_id));
          if (takenPath && takenPath.children && takenPath.children.length > 0) {
            maxLength += getPossibleMaxDepth(takenPath.children);
          }
        } else {
          // Brak odpowiedzi - symulujemy najdłuższą możliwą ścieżkę z tego punktu
          let maxChild = 0;
          if (item.paths && item.paths.length > 0) {
            for (const path of item.paths) {
              const childDepth = getPossibleMaxDepth(path.children);
              if (childDepth > maxChild) {
                maxChild = childDepth;
              }
            }
          }
          maxLength += maxChild;
        }
      }
      return maxLength;
    }

    return getPossibleMaxDepth(version.layout_data);
  }, [version, answers]);

  // 2. Niezawodne badanie ostatniego pytania
  const isLastQuestion = useMemo(() => {
    if (!currentQuestionId || !version) return false;

    const seq = sequence;
    const idx = seq.indexOf(currentQuestionId);

    // Jeśli po obecnym pytaniu są już ustawione w kolejce inne, to nie jest to koniec
    if (idx >= 0 && idx < seq.length - 1) return false;

    const hasAnswered = answers[currentQuestionId] && answers[currentQuestionId].length > 0;

    if (hasAnswered) {
      // Skoro odpowiedział, a getSequence nie dodało nic nowego - to był koniec
      return idx === seq.length - 1;
    } else {
      // Nie odpowiedział. Sprawdzamy, czy to pytanie w ogóle posiada ukryte ścieżki w CMS
      let hasPaths = false;
      function checkPaths(items: LayoutItem[]) {
        for (const item of items) {
          if (item.question_id === currentQuestionId) {
            if (item.paths && item.paths.some(p => p.children && p.children.length > 0)) {
              hasPaths = true;
            }
            return;
          }
          if (item.paths) {
            for (const path of item.paths) {
              checkPaths(path.children);
            }
          }
        }
      }
      checkPaths(version.layout_data);

      if (hasPaths) return false; // Odpowiedź otworzy nowe pytania, pokazuj "Dalej"
      return true; // Pytanie nie ma ścieżek i jest ostatnie w kolejce, pokazuj "Zapisz wynik"
    }
  }, [currentQuestionId, version, answers, sequence]);

  // 3. Płynny i logiczny pasek postępu
  const getProgress = useCallback(() => {
    if (!version || estimatedTotalQuestions === 0) return 0;
    
    const hasAnswered = currentQuestionId ? (answers[currentQuestionId] && answers[currentQuestionId].length > 0) : false;
    
    // Równe 100% dopiero na faktycznym końcu z zaznaczoną odpowiedzią
    if (isLastQuestion && hasAnswered) return 100;
    
    // Wliczamy obecne pytanie do widocznego postępu (history.length + 1)
    const currentStep = history.length + 1;
    const percentage = Math.round((currentStep / estimatedTotalQuestions) * 100);
    
    return Math.min(100, percentage);
  }, [isLastQuestion, history.length, estimatedTotalQuestions, version, currentQuestionId, answers]);

  // Snapshot generation
  const submitQuiz = useCallback((): QuizSubmissionPayload | null => {
    if (!version) return null;

    // Pobierz ostateczną ścieżkę na podstawie aktualnych odpowiedzi (Garbage Collection osieroconych ścieżek)
    const finalSequence = computeSequence(answers);
    
    // Filtrujemy tylko te pytania z ostatecznej ścieżki, na które padła odpowiedź
    const answeredQuestionIds = finalSequence.filter(qId => answers[qId] && answers[qId].length > 0);

    const payloadAnswers = answeredQuestionIds.map(qId => {
      const q = questions.find(x => x.id === qId);
      const selectedIds = answers[qId] ?? [];
      
      const snapshot: SnapshotData = {
        question_content: q?.content ?? '',
        question_type: q?.question_type ?? 'single',
        answers: (q?.answers ?? [])
          .filter(a => selectedIds.includes(a.id))
          .map(a => ({
            answer_id: a.id,
            content: a.content,
            tags: (a.answer_tags ?? []).map(at => ({
              tag_slug: at.tags?.slug ?? '',
              points: at.points
            }))
          }))
      };

      return {
        question_id: qId,
        selected_answer_ids: selectedIds,
        snapshot
      };
    });

    return {
      version_id: version.id,
      answers: payloadAnswers
    };
  }, [history, answers, questions, version, computeSequence]);

  return {
    currentQuestionId,
    history,
    answers,
    direction,
    estimatedTotalQuestions,
    isLastQuestion,
    handleAnswer,
    handleNext,
    handleBack,
    getProgress,
    submitQuiz,
    clearSavedProgress
  };
}
