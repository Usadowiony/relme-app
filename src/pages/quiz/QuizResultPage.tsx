import { useEffect, useState } from 'react';
import { useNavigate, useRouteLoaderData } from 'react-router-dom';
import { getUserQuizResult } from '../../api/quiz.api';
import { useLogout } from '../../hooks/useLogout';
import { GlobalLoader } from '../../components/ui/Loader/GlobalLoader';
import { AsyncButton } from '../../components/ui/buttons/Button';
import Toast from '../../components/ui/popups/Toast';
import BackgroundBlobs from '../../components/layout/BackgroundBlobs';
import { LogOut, LayoutDashboard } from 'lucide-react';
import type { AuthState } from '../../router';

export default function QuizResultPage() {
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resultData, setResultData] = useState<unknown>(null);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('error');
  const navigate = useNavigate();
  const logout = useLogout();

  // Loader data provides role info for admin/mentor users
  const loaderData = useRouteLoaderData('quiz-result') as AuthState | null;
  const isPrivileged = loaderData?.role === 'admin' || loaderData?.role === 'mentor';

  useEffect(() => {
    async function fetchResult() {
      try {
        const res = await getUserQuizResult();
        if (!res) {
          navigate('/quiz', { replace: true });
          return;
        }

        if (res.payment_status === 'paid') {
          navigate('/dashboard', { replace: true });
          return;
        }

        setResultData(res.computed_result);
      } catch (error: unknown) {
        console.error('Błąd pobierania wyników:', error);
        navigate('/quiz', { replace: true });
      } finally {
        setLoading(false);
      }
    }

    void fetchResult();
  }, [navigate]);

  const handleUnlock = async () => {
    setIsSubmitting(true);
    setToastMessage('');

    // Symulacja ładowania 1.5s
    await new Promise(resolve => setTimeout(resolve, 1500));

    setIsSubmitting(false);
    setToastType('success');
    setToastMessage('Bramka płatności w przygotowaniu');
  };

  const handleLogout = () => void logout();

  if (loading) {
    return <GlobalLoader isLoading={true} />;
  }

  return (
    <BackgroundBlobs>
      <div className="min-h-[100dvh] flex flex-col items-center justify-center p-6 bg-white md:bg-transparent relative">
        <Toast
          open={Boolean(toastMessage)}
          message={toastMessage}
          type={toastType}
          title="Informacja"
          position="top"
          durationMs={3000}
          onClose={() => setToastMessage('')}
        />

        <div className="w-full max-w-2xl bg-white md:rounded-3xl md:shadow-xl md:border md:border-gray-100 p-8 flex flex-col items-center">
          <h1 className="text-3xl font-bold text-dark mb-4 text-center">Twój Profil Diagnostyczny</h1>
          <p className="text-dark/70 mb-8 text-center">
            Poniżej znajduje się wyliczony wynik na podstawie odpowiedzi (Dev Preview). Wszystko dopiero w rozbudowie
          </p>

          <div className="w-full bg-gray-50 rounded-xl p-4 mb-8 overflow-auto border border-gray-100">
            <pre className="text-sm text-gray-800 whitespace-pre-wrap">
              {JSON.stringify(resultData, null, 2)}
            </pre>
          </div>

          <AsyncButton
            onClick={() => void handleUnlock()}
            isLoading={isSubmitting}
            variant="quiz"
            className="w-full md:w-auto md:px-12"
          >
            Tu będzie przycisk dalej
          </AsyncButton>

          {/* Admin/Mentor: Dashboard shortcut */}
          {isPrivileged && (
            <button
              onClick={() => navigate('/admin/quiz', { replace: true })}
              className="mt-6 md:mt-10 inline-flex items-center gap-2 md:gap-3 text-sm md:text-base font-medium text-primary hover:text-primary/80 transition-colors cursor-pointer"
            >
              <LayoutDashboard className="size-4 md:size-6" />
              Powrót do panelu admina
            </button>
          )}

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="mt-4 md:mt-10 inline-flex items-center gap-2 md:gap-3 text-sm md:text-base font-medium text-dark/50 hover:text-dark/80 transition-colors cursor-pointer"
          >
            <LogOut className="size-4 md:size-6" />
            Wyloguj się
          </button>
        </div>
      </div>
    </BackgroundBlobs>
  );
}
