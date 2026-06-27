import { motion, AnimatePresence } from 'framer-motion';
import { useQuizPlayer } from './hooks/useQuizPlayer';
import { GlobalLoader } from '../../components/ui/Loader/GlobalLoader';
import { SingleChoiceRenderer, MultiChoiceRenderer, ScaleRenderer } from '../../components/quiz/QuestionRenderers';
import { AsyncButton } from '../../components/ui/buttons/Button';
import BackgroundBlobs from '../../components/layout/BackgroundBlobs';
import TopNavigation from '../../components/layout/Navbar/TopNavigation';
import Toast from '../../components/ui/popups/Toast';
import type { Question } from '../../types/quiz';
import { ChevronLeft, LogOut } from 'lucide-react';
import logoLong from '../../assets/icons/logo-long.svg';

// =============================================
// PURE RENDER HELPER
// =============================================

function renderQuestion(
  question: Question,
  selectedIds: string[],
  onSelect: (ids: string[]) => void
) {
  const props = {
    answers: question.answers ?? [],
    selectedIds,
    onSelect,
  };

  switch (question.question_type) {
    case 'single': return <SingleChoiceRenderer {...props} />;
    case 'multi': return <MultiChoiceRenderer {...props} />;
    case 'scale': return <ScaleRenderer {...props} />;
    default: return <SingleChoiceRenderer {...props} />;
  }
}

// =============================================
// QUIZ PLAYER PAGE (Pure Render Component)
// =============================================

export default function QuizPlayerPage() {
  const {
    userId,
    loading,
    isSubmitting,
    toastMessage,
    toastType,
    version,
    isDesktop,
    currentQuestionId,
    currentQuestion,
    selectedIds,
    direction,
    history,
    estimatedTotalQuestions,
    isLastQuestion,
    handleAnswer,
    handleBack,
    progress,
    isStepValid,
    handleLogout,
    handleNextOrSubmit,
    activeVariants,
    activeTransition,
    setToastMessage,
  } = useQuizPlayer();

  if (!userId) {
    return <GlobalLoader isLoading={true} />;
  }

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

      <div className="h-[100dvh] mx-auto bg-white md:bg-transparent flex flex-col font-manrope overflow-hidden relative lg:max-w-5xl 2xl:max-w-[1440px] mx-auto w-full">
        <TopNavigation
          className="hidden md:block"
          leftSlot={<img src={logoLong} alt="Relme" className="h-8 4xl:h-10 w-auto" />}
          rightSlot={(
            <AsyncButton
              type="button"
              variant="link"
              onClick={() => void handleLogout()}
            >
              <span className="inline-flex items-center gap-2">
                <LogOut className="size-4 4xl:size-6" />
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
                    className="bg-primary-2 h-full rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SCROLLABLE CONTENT AREA */}
        <div className="flex-grow overflow-y-auto w-full flex flex-col items-center">
          <div className="w-full flex-grow flex flex-col items-center justify-start pt-4 md:px-6 md:min-h-[calc(100dvh-160px)] md:justify-center md:py-0">

            {!loading && !version && !toastMessage && (
              <div className="flex flex-col items-center justify-center text-center px-4">
                <h2 className="text-2xl font-bold text-dark mb-4">Brak aktywnego quizu</h2>
                <p className="text-gray-500">Obecnie nie ma żadnej opublikowanej wersji quizu.</p>
              </div>
            )}

            {version && (
              <motion.div
                layout={isDesktop}
                transition={isDesktop ? { duration: 0.4, ease: [0.25, 1, 0.5, 1] } : undefined}
                className="md:max-h-[calc(100dvh-140px)] w-full flex flex-col md:max-w-[780px] lg:max-w-[940px] md:mx-auto md:bg-white md:rounded-[32px] md:shadow-large md:border md:border-gray-100 overflow-hidden relative"
              >
                <div
                  className="flex flex-col flex-grow md:min-h-0 w-full"
                >
                  <div className="shrink-0 hidden md:block px-12 md:px-0 pt-10 md:pt-10 md:mb-4 3xl:mb-8 md:max-w-[600px] lg:max-w-[830px] mx-auto w-full">
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
                        className="bg-primary-2 h-full rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  {/* QUIZ CONTENT - Framer Motion AnimatePresence */}
                  <div className="relative md:overflow-y-auto flex-grow flex flex-col md:min-h-0">
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
                          className="flex flex-col h-full md:h-auto md:min-h-full w-full md:max-w-[660px] lg:max-w-[940px] mx-auto"
                        >
                          <div className="h-full w-full md:h-auto md:min-h-full flex flex-col mx-auto px-3 2xs:px-6 2xs:px-10 sm:px-12 xs:max-w-[520px] 2sm:max-w-[570px] sm:max-w-[700px] md:max-w-[800px] lg:max-w-[950px] md:px-8 pt-1 md:pb-4 gap-6 md:gap-6 3xl:gap-10">
                            <div className="flex flex-col md:flex-row md:items-center md:gap-8 md:max-w-[580px] lg:max-w-[800px] lg:px-8">
                              {currentQuestion.media_assets?.file_url && (
                                <div className="w-full 2xs:py-2 md:w-[20%] md:shrink-0 flex justify-center items-start">
                                  <img
                                    src={currentQuestion.media_assets.file_url}
                                    alt="Załącznik do pytania"
                                    className="w-[120px] 2xs:w-[150px] xs:w-[37%] sm:w-[40%] sm:max-w-[220px] md:w-full md:max-w-[140px] lg:max-w-[230px] aspect-square object-contain mix-blend-multiply mb-2"
                                  />
                                </div>
                              )}

                              <div className="2xs:mt-2 w-full min-h-0 flex flex-col justify-center">
                                <h2 className="text-[19px] 2xs:text-[24px] xs:text-[25px] 2sm:text-[28px] sm:text-[32px] 3xl:text-[34px] font-bold text-dark mb-2 xs:mb-3 2sm:mb-4 leading-[26px] xs:leading-[29px] sm:leading-[34px] md:leading-[40px] 3xl:leading-[46px]">
                                  {currentQuestion.content}
                                </h2>

                                {currentQuestion.question_type === 'multi' && (
                                  <p className="text-[#3A5A60] font-medium text-[12px] 2xs:text-[13px] xs:text-[14px] sm:text-[15px] 2xs:mb-2 md:mb-0">
                                    *Możesz zaznaczyć maksymalnie trzy odpowiedzi
                                  </p>
                                )}
                                {currentQuestion.question_type === 'single' && (
                                  <p className="text-[#3A5A60] font-medium text-[12px] 2xs:text-[13px] xs:text-[14px] sm:text-[15px] 2xs:mb-2 md:mb-0">
                                    *Możesz zaznaczyć jedną odpowiedź
                                  </p>
                                )}
                                {currentQuestion.question_type === 'scale' && (
                                  <p className="text-[#3A5A60] font-medium text-[12px] 2xs:text-[13px] xs:text-[14px] sm:text-[15px] 2xs:mb-2 md:mb-0">
                                    *Przesuń suwak, aby zaznaczyć odpowiedź
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="w-full pb-4 3xl:pb-8 md:max-w-[700px] lg:max-w-[800px] mx-auto">
                              {renderQuestion(currentQuestion, selectedIds, (ids) => handleAnswer(currentQuestion.id, ids))}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="hidden md:flex shrink-0 bg-white z-10 items-center justify-center gap-10 px-12 pb-8 shadow-[0_-1px_6px_18px] shadow-white">
                    {history.length > 0 && (
                      <AsyncButton
                        onClick={handleBack}
                        variant="outline"
                      >
                        Wstecz
                      </AsyncButton>
                    )}
                    <AsyncButton
                      onClick={handleNextOrSubmit}
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
                onClick={handleNextOrSubmit}
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
