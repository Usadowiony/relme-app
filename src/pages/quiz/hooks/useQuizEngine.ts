import { useState, useEffect, useCallback } from 'react';
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

  // Save to LocalStorage
  const saveState = useCallback((newHistory: string[], newAnswers: AnswersState, newCurrentId: string | null) => {
    if (!version || !storageKey) return;
    setHistory(newHistory);
    setAnswers(newAnswers);
    setCurrentQuestionId(newCurrentId);
    
    localStorage.setItem(storageKey, JSON.stringify({
      history: newHistory,
      answers: newAnswers,
      currentQuestionId: newCurrentId
    }));
  }, [version, storageKey]);

  const clearSavedProgress = useCallback(() => {
    if (storageKey) {
      localStorage.removeItem(storageKey);
    }
  }, [storageKey]);

  // Compute deterministic sequence of questions based on current answers
  const getSequence = useCallback((currentAnswers: AnswersState) => {
    if (!version) return [];
    const seq: string[] = [];
    
    function traverse(items: LayoutItem[]) {
      for (const item of items) {
        seq.push(item.question_id);
        const itemAnswers = currentAnswers[item.question_id];
        
        if (itemAnswers && itemAnswers.length > 0) {
          // If we answered this question, check if it leads to a specific path
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

  // MapsNext: Jawne przejście do następnego kroku (wywoływane przyciskiem "Dalej")
  const MapsNext = useCallback(() => {
    if (!currentQuestionId) return;

    setDirection(1); // Mark as forward movement
    const seq = getSequence(answers);
    const currentIndex = seq.indexOf(currentQuestionId);
    const nextId = currentIndex >= 0 && currentIndex < seq.length - 1 ? seq[currentIndex + 1] : null;

    const newHistory = [...history, currentQuestionId];
    saveState(newHistory, answers, nextId);
  }, [answers, history, currentQuestionId, saveState, getSequence]);

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

  // Dynamiczny Horyzont: szacunkowa liczba pytań = odpowiedziane + aktualna ścieżka
  const estimatedTotalQuestions = history.length + getSequence(answers).length;
  const isLastQuestion = Boolean(currentQuestionId) && history.length + 1 >= estimatedTotalQuestions;

  // Progress w oparciu o aktualną ścieżkę
  const getProgress = useCallback(() => {
    if (!version || estimatedTotalQuestions === 0) return 0;
    
    // Procent = historia / szacunkowy total
    return Math.round((history.length / estimatedTotalQuestions) * 100);
  }, [history.length, estimatedTotalQuestions]);

  // Snapshot generation
  const submitQuiz = useCallback((): QuizSubmissionPayload | null => {
    if (!version) return null;

    // Pobierz ostateczną ścieżkę na podstawie aktualnych odpowiedzi (Garbage Collection osieroconych ścieżek)
    const finalSequence = getSequence(answers);
    
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
  }, [history, answers, questions, version]);

  return {
    currentQuestionId,
    history,
    answers,
    direction,
    estimatedTotalQuestions,
    isLastQuestion,
    handleAnswer,
    MapsNext,
    handleBack,
    getProgress,
    submitQuiz,
    clearSavedProgress
  };
}
