import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { easeInOut, easeOut } from 'framer-motion';
import { useQuizEngine } from './useQuizEngine';
import { useLogout } from '../../../hooks/useLogout';
import { useAuth } from '../../../auth/AuthProvider';
import { getLiveQuiz, submitQuizResult } from '../../../api/quiz.api';
import type { QuizVersion, Question } from '../../../types/quiz';

// =============================================
// ANIMATION VARIANTS (exported for component)
// =============================================

export const questionVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 600 : -600,
    opacity: 0,
  }),
  center: {
    zIndex: 1,
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    zIndex: 0,
    x: direction > 0 ? -600 : 600,
    opacity: 0,
  }),
};

export const desktopQuestionVariants = {
  enter: {
    opacity: 0,
  },
  center: {
    opacity: 1,
    transition: {
      duration: 0.4,
      delay: 0.2,
      ease: easeOut,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: 0.001,
      ease: 'linear' as const,
    },
  },
};

// =============================================
// HOOK: useQuizPlayer
// =============================================

export function useQuizPlayer() {
  const { session } = useAuth();
  const userId = session?.user?.id ?? '';
  const navigate = useNavigate();

  // --- Data State ---
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('error');
  const [version, setVersion] = useState<QuizVersion | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isDesktop, setIsDesktop] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(min-width: 768px)').matches;
    }
    return false;
  });

  // --- Quiz Data Fetching ---
  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const { version: liveVersion, questions: quizQuestions } = await getLiveQuiz();

        // Preload first 3 images on initial load
        const INITIAL_PRELOAD_COUNT = 3;
        quizQuestions.slice(0, INITIAL_PRELOAD_COUNT).forEach(q => {
          if (q.media_assets?.file_url) {
            const img = new Image();
            img.src = q.media_assets.file_url;
          }
        });

        setVersion(liveVersion);
        setQuestions(quizQuestions);
        setLoading(false);
      } catch (err: unknown) {
        console.error('Błąd pobierania quizu', err);
        setToastType('error');
        setToastMessage(err instanceof Error ? err.message : 'Nie udało się pobrać quizu.');
        setLoading(false);
      }
    };
    void fetchQuiz();
  }, []);

  // --- Desktop Media Query ---
  useEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 768px)');
    const handleChange = (event: MediaQueryListEvent | MediaQueryList) => {
      setIsDesktop(event.matches);
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }

    mediaQuery.addListener(handleChange);
    return () => mediaQuery.removeListener(handleChange);
  }, []);

  // --- Quiz Engine ---
  const engine = useQuizEngine(userId, version, questions);

  // --- Lookahead Image Preloader ---
  const LOOKAHEAD_COUNT = 3;
  useEffect(() => {
    if (!engine.currentQuestionId || !version || questions.length === 0) return;

    const currentIdx = questions.findIndex(q => q.id === engine.currentQuestionId);
    if (currentIdx < 0) return;

    for (let i = 1; i <= LOOKAHEAD_COUNT; i++) {
      const nextQ = questions[currentIdx + i];
      if (nextQ?.media_assets?.file_url) {
        const img = new Image();
        img.src = nextQ.media_assets.file_url;
      }
    }
  }, [engine.currentQuestionId, version, questions]);

  // --- Derived State ---
  const currentQuestion = questions.find(q => q.id === engine.currentQuestionId) ?? null;
  const selectedIds = engine.currentQuestionId ? (engine.answers[engine.currentQuestionId] ?? []) : [];

  const isStepValid = useCallback((): boolean => {
    if (!currentQuestion) return false;

    if (currentQuestion.question_type === 'single') return selectedIds.length === 1;
    if (currentQuestion.question_type === 'multi') return selectedIds.length > 0 && selectedIds.length <= 3;
    if (currentQuestion.question_type === 'scale') return selectedIds.length === 1;

    return false;
  }, [currentQuestion, selectedIds]);

  // --- Submission ---
  const handleSubmit = useCallback(async () => {
    const payload = engine.submitQuiz();
    if (!payload) return;

    setIsSubmitting(true);
    setToastMessage('');

    try {
      await submitQuizResult(payload);

      // Clear progress after successful submission
      engine.clearSavedProgress();

      setToastType('success');
      setToastMessage('Wynik został pomyślnie zapisany.');

      setTimeout(() => {
        navigate('/quiz/result', { replace: true });
      }, 1500);
    } catch (err: unknown) {
      setToastType('error');
      setToastMessage(err instanceof Error ? err.message : 'Wystąpił błąd podczas wysyłania.');
      setIsSubmitting(false);
    }
  }, [engine, navigate]);

  // --- Logout ---
  const logout = useLogout();
  const handleLogout = useCallback(() => void logout(), [logout]);

  // --- Animation Config ---
  const progress = engine.getProgress();
  const activeVariants = isDesktop ? desktopQuestionVariants : questionVariants;
  const activeTransition = isDesktop
    ? undefined
    : { duration: 0.4, ease: easeInOut };

  // --- Combined Next/Submit Handler ---
  const handleNextOrSubmit = useMemo(() => {
    if (engine.isLastQuestion) {
      return () => void handleSubmit();
    }
    return engine.handleNext;
  }, [engine.isLastQuestion, engine.handleNext, handleSubmit]);

  return {
    // Data
    userId,
    loading,
    isSubmitting,
    toastMessage,
    toastType,
    version,
    isDesktop,

    // Engine (forwarded)
    currentQuestionId: engine.currentQuestionId,
    currentQuestion,
    selectedIds,
    direction: engine.direction,
    history: engine.history,
    estimatedTotalQuestions: engine.estimatedTotalQuestions,
    isLastQuestion: engine.isLastQuestion,
    handleAnswer: engine.handleAnswer,
    handleNext: engine.handleNext,
    handleBack: engine.handleBack,
    progress,

    // Computed / Handlers
    isStepValid,
    handleSubmit,
    handleLogout,
    handleNextOrSubmit,
    activeVariants,
    activeTransition,
    setToastMessage,
  };
}
