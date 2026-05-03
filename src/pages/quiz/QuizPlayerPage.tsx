import { useState, useEffect } from 'react';
import { motion, AnimatePresence, easeInOut, easeOut } from 'framer-motion';
import { useQuizEngine } from './hooks/useQuizEngine';
import { GlobalLoader } from '../../components/ui/Loader/GlobalLoader';
import { SingleChoiceRenderer, MultiChoiceRenderer, ScaleRenderer } from '../../components/quiz/QuestionRenderers';
import { AsyncButton } from '../../components/ui/buttons/Button';
import BackgroundBlobs from '../../components/layout/BackgroundBlobs';
import TopNavigation from '../../components/layout/Navbar/TopNavigation';
import Toast from '../../components/ui/popups/Toast';
import { getLiveQuiz, submitQuizResult } from '../../api/quiz.api';
import { supabase } from '../../api/supabase';
import type { QuizVersion, Question } from '../../types/quiz';
import { ChevronLeft, LogOut } from 'lucide-react';
import logoLong from '../../assets/icons/logo-long.svg';

import { useAuth } from '../../auth/AuthProvider';

// Warianty animacji dla Framer Motion
const questionVariants = {
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


const desktopQuestionVariants = {
  enter: {
    opacity: 0,
  },
  center: {
    opacity: 1,
    transition: {
      duration: 0.4,
      delay: 0.2, // Dajemy karcie ułamek sekundy "przewagi" na rozpoczęcie zmiany wymiaru
      ease: easeOut,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: 0.001, // MAGIA: Błyskawiczny zanik. Tekst znika, zanim karta zdąży go uciąć!
      ease: 'linear' as const,
    },
  },
};

export default function QuizPlayerPage() {
  const { session } = useAuth();
  const userId = session?.user?.id || '';

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

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const { version: liveVersion, questions: quizQuestions } = await getLiveQuiz();

        // --- NOWE: Cichy preloading obrazków w tle ---
        quizQuestions.forEach(q => {
          if (q.media_assets?.file_url) {
            const img = new Image();
            img.src = q.media_assets.file_url; // To wymusza pobranie pliku do cache
          }
        });
        // ---------------------------------------------

        setVersion(liveVersion);
        setQuestions(quizQuestions);
        setLoading(false);
      } catch (err) {
        console.error('Błąd pobierania quizu', err);
        setToastType('error');
        setToastMessage(err instanceof Error ? err.message : 'Nie udało się pobrać quizu.');
        setLoading(false);
      }
    };
    void fetchQuiz();
  }, []);

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

  const {
    currentQuestionId,
    answers,
    direction,
    handleAnswer,
    MapsNext,
    handleBack,
    getProgress,
    submitQuiz,
    history,
    estimatedTotalQuestions,
    clearSavedProgress,
    isLastQuestion
  } = useQuizEngine(userId, version, questions);

  const currentQuestion = questions.find(q => q.id === currentQuestionId);
  const selectedIds = currentQuestionId ? (answers[currentQuestionId] || []) : [];

  const isStepValid = () => {
    if (!currentQuestion) return false;

    if (currentQuestion.question_type === 'single') return selectedIds.length === 1;
    if (currentQuestion.question_type === 'multi') return selectedIds.length > 0 && selectedIds.length <= 3;
    if (currentQuestion.question_type === 'scale') return selectedIds.length === 1;

    return false;
  };

  const handleSubmit = async () => {
    const payload = submitQuiz();
    if (!payload) return;

    setIsSubmitting(true);
    setToastMessage('');

    try {
      await submitQuizResult(payload);

      // Clear progress after successful submission
      clearSavedProgress();

      setToastType('success');
      setToastMessage('Wynik został pomyślnie zapisany.');

      setTimeout(() => {
        window.history.replaceState({}, '', '/');
        window.dispatchEvent(new PopStateEvent('popstate'));
      }, 1500);

    } catch (err) {
      setToastType('error');
      setToastMessage(err instanceof Error ? err.message : 'Wystąpił błąd podczas wysyłania.');
      setIsSubmitting(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  if (!userId) {
    return <GlobalLoader isLoading={true} />;
  }

  const renderCurrentQuestion = () => {
    if (!currentQuestion) return null;

    const props = {
      answers: currentQuestion.answers || [],
      selectedIds,
      onSelect: (ids: string[]) => handleAnswer(currentQuestion.id, ids)
    };

    switch (currentQuestion.question_type) {
      case 'single': return <SingleChoiceRenderer {...props} />;
      case 'multi': return <MultiChoiceRenderer {...props} />;
      case 'scale': return <ScaleRenderer {...props} />;
      default: return <SingleChoiceRenderer {...props} />;
    }
  };

  const progress = getProgress();
  const activeVariants = isDesktop ? desktopQuestionVariants : questionVariants;
  const activeTransition = isDesktop
    ? undefined
    : { duration: 0.4, ease: easeInOut };


  return (
    <BackgroundBlobs>
      <GlobalLoader isLoading={loading} />
      <Toast
        open={Boolean(toastMessage)}
        message={toastMessage}
        type={toastType}
        title={toastType === 'error' ? 'Mamy problem!' : 'Sukces'}
        position="top"
        durationMs={3000}
        onClose={() => setToastMessage('')}
      />

      <div className="h-[100dvh] mx-auto bg-white md:bg-transparent flex flex-col font-manrope overflow-hidden relative">
        <TopNavigation
          className="hidden md:block"
          leftSlot={<img src={logoLong} alt="Relme" className="h-8 w-auto" />}
          rightSlot={(
            <AsyncButton
              type="button"
              variant="link"
              onClick={() => void handleLogout()}
            >
              <span className="inline-flex items-center gap-2">
                <LogOut className="size-4" />
                Wyloguj się
              </span>
            </AsyncButton>
          )}
        />

        {/* STICKY TOP NAVBAR (Mobile Only) */}
        {version && currentQuestionId && currentQuestion && (
          <div className="md:hidden w-full mx-auto px-3 2xs:px-4 2xs:px-8 sm:px-10 xs:max-w-[530px] 2sm:max-w-[580px] sm:max-w-[710px] mt-2 2xs:mt-3 2sm:mt-4 sm:mt-6 flex-shrink-0 bg-white pt-4 pb-2 xs:pb-3 2sm:pb-4 z-[40]">
            <div className="mx-auto w-full flex items-center gap-2">
              <button
                onClick={handleBack}
                disabled={history.length === 0}
                className={`transition-opacity ${history.length === 0 ? 'hidden opacity-0 pointer-events-none' : 'opacity-100'}`}
              >
                <ChevronLeft className="w-6 h-6 2xs:w-7 2xs:h-7 2sm:w-8 2sm:h-8 text-dark/90 stroke-[2.5px] xs:stroke-3" />
              </button>
              <div className="flex-grow xs:ml-1 2sm:ml-2">
                <div className="flex items-center justify-between mb-2 sm:mb-3 px-1">
                  <span className="font-manrope font-semibold text-[11px] xs:text-[12px] 2sm:text-[13px] uppercase tracking-[1px] leading-[15px] text-dark/70">
                    PYTANIE {history.length + 1} Z {estimatedTotalQuestions}
                  </span>
                  <span className="font-manrope font-semibold text-[11px] xs:text-[12px] 2sm:text-[13px] tracking-[1px] leading-[15px] text-dark/70">
                    {progress}%
                  </span>
                </div>

                {/* Progress Bar Container */}
                <div className="w-full bg-[#ECEEEE] h-2 2sm:h-3 rounded-full overflow-hidden border border-[#E9E9E9]">
                  <div
                    className="bg-[#245A65] h-full rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SCROLLABLE CONTENT AREA */}
        <div className="flex-grow overflow-y-auto w-full flex flex-col items-center">
          <div className="w-full flex-grow flex flex-col items-center justify-start pt-4 md:pt-8 md:px-6 md:min-h-[calc(100dvh-160px)] md:justify-center md:py-10">

            {!loading && !version && !toastMessage && (
              <div className="flex flex-col items-center justify-center text-center px-4">
                <h2 className="text-2xl font-bold text-dark mb-4">Brak aktywnego quizu</h2>
                <p className="text-gray-500">Obecnie nie ma żadnej opublikowanej wersji quizu.</p>
              </div>
            )}

            {version && (
              <motion.div
                /* TUTAJ ANIMACJA */
                layout={isDesktop}
                transition={isDesktop ? { duration: 0.4, ease: [0.25, 1, 0.5, 1] } : undefined}
                className="w-full flex flex-col md:mb-12 md:max-w-[90vw] lg:max-w-[1100px] md:mx-auto md:bg-white md:rounded-[32px] md:shadow-large md:border md:border-gray-100 overflow-hidden relative"
              >
                <div
                  className="flex flex-col"
                >
                  <div className="hidden md:block px-12 pt-10 md:mb-8 md:max-w-[820px] lg:max-w-[1000px] mx-auto w-full">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-manrope font-semibold text-[13px] uppercase tracking-[1px] leading-[15px] text-dark/70">
                        PYTANIE {history.length + 1} Z {estimatedTotalQuestions}
                      </span>
                      <span className="font-manrope font-semibold text-[13px] tracking-[1px] leading-[15px] text-dark/70">
                        {progress}%
                      </span>
                    </div>

                    <div className="w-full bg-[#ECEEEE] h-3 rounded-full overflow-hidden border border-[#E9E9E9]">
                      <div
                        className="bg-[#245A65] h-full rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  {/* QUIZ CONTENT - Framer Motion AnimatePresence */}
                  <div className="relative overflow-hidden flex-grow flex flex-col">
                    <AnimatePresence mode="popLayout" custom={direction} initial={false}>
                      {currentQuestionId && currentQuestion && (
                        <motion.div
                          key={currentQuestionId}
                          custom={direction}
                          variants={activeVariants}
                          initial="enter"
                          animate="center"
                          exit="exit"
                          transition={activeTransition}
                          className="flex flex-col w-full"
                        >
                          <div className="flex flex-col mx-auto px-3 2xs:px-6 2xs:px-10 sm:px-12 xs:max-w-[520px] 2sm:max-w-[570px] sm:max-w-[700px] md:max-w-[800px] lg:max-w-[950px] md:min-w-[650px] lg:min-w-[950px] md:px-8 pt-1 md:pt-8 pb-12 md:pb-28 lg:pb-32 gap-6 md:gap-14 lg:gap-18">
                            <div className="flex flex-col md:flex-row md:items-center md:gap-6">
                              {currentQuestion.media_assets?.file_url && (
                                <div className="w-full 2xs:py-2 md:w-[30%] md:shrink-0 flex justify-center items-start">
                                  <img
                                    src={currentQuestion.media_assets.file_url}
                                    alt="Załącznik do pytania"
                                    className="w-[140px] 2xs:w-[170px] xs:w-[40%] sm:w-[42%] md:w-full lg:max-w-[230px] aspect-square object-contain mix-blend-multiply"
                                  />
                                </div>
                              )}

                              <div className="2xs:mt-2 w-full min-h-0 flex flex-col justify-center">
                                <h2 className="text-[19px] 2xs:text-[24px] xs:text-[25px] 2sm:text-[28px] sm:text-[32px] md:text-[34px] font-bold text-dark mb-2 xs:mb-3 2sm:mb-4 leading-[26px] xs:leading-[29px] sm:leading-[34px] md:leading-[46px]">
                                  {currentQuestion.content}
                                </h2>

                                {currentQuestion.question_type === 'multi' && (
                                  <p className="text-[#3A5A60] font-medium text-[12px] 2xs:text-[13px] xs:text-[14px] sm:text-[15px] mb-6 2xs:mb-8 sm:mb-10 md:mb-0">
                                    *Możesz zaznaczyć maksymalnie trzy odpowiedzi
                                  </p>
                                )}
                                {currentQuestion.question_type === 'single' && (
                                  <p className="text-[#3A5A60] font-medium text-[12px] 2xs:text-[13px] xs:text-[14px] sm:text-[15px] mb-6 2xs:mb-8 sm:mb-10 md:mb-0">
                                    *Możesz zaznaczyć jedną odpowiedź
                                  </p>
                                )}
                                {currentQuestion.question_type === 'scale' && (
                                  <p className="text-[#3A5A60] font-medium text-[12px] 2xs:text-[13px] xs:text-[14px] sm:text-[15px] mb-6 2xs:mb-8 sm:mb-10 md:mb-0">
                                    *Przesuń suwak, aby zaznaczyć odpowiedź
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="w-full md:mb-10 md:max-w-[700px] lg:max-w-[1000px] mx-auto">
                              {renderCurrentQuestion()}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="hidden md:flex md:absolute md:bottom-0 md:left-0 md:right-0 items-center justify-center gap-10 px-12 pb-8 pt-4">
                    {history.length > 0 && (
                      <AsyncButton
                        onClick={handleBack}
                        variant="outline"
                      >
                        Wstecz
                      </AsyncButton>
                    )}
                    <AsyncButton
                      onClick={isLastQuestion ? () => void handleSubmit() : MapsNext}
                      disabled={!isStepValid()}
                      isLoading={isLastQuestion ? isSubmitting : false}
                      variant="quiz"
                      className="md:w-auto"
                    >
                      {isLastQuestion ? 'Zapisz wynik' : 'Dalej'}
                    </AsyncButton>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* STICKY BOTTOM ACTIONS (Outside scroll area) */}
        {version && currentQuestionId && currentQuestion && (
          <div className="md:hidden flex-shrink-0 px-6 shadow-[0_-1px_3px_8px] shadow-white z-[40]">
            <div className="w-full mx-auto px-3 2xs:px-4 2xs:px-6 sm:px-10 xs:max-w-[530px] 2sm:max-w-[580px] sm:max-w-[710px] md:max-w-[980px] lg:max-w-[1000px] mb-2 2xs:mb-3 2sm:mb-4 sm:mb-6 w-full flex items-center justify-center md:justify-end md:gap-4">
              <AsyncButton
                onClick={isLastQuestion ? () => void handleSubmit() : MapsNext}
                disabled={!isStepValid()}
                isLoading={isLastQuestion ? isSubmitting : false}
                variant="quiz"
                className="w-full md:w-auto"
              >
                {isLastQuestion ? 'Zapisz wynik' : 'Dalej'}
              </AsyncButton>
            </div>
          </div>
        )}
      </div>
    </BackgroundBlobs>
  );
}
