import { Suspense, lazy } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { BaseRouter } from './components/BaseRouter.jsx';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AppShell from './components/AppShell';
import LandingPage from './pages/LandingPage';
import PrivacyPage from './pages/PrivacyPage';
import ImprintPage from './pages/ImprintPage';
import AccessibilityPage from './pages/AccessibilityPage';
import { SettingsProvider } from './contexts/SettingsContext';
import { I18nProvider } from './i18n';

/*
 * The signed-in app is a separate bundle. A visitor who only reads the
 * landing page never downloads Firebase, the chat or the OCR worker.
 */
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const SubjectsPage = lazy(() => import('./pages/SubjectsPage'));
const TasksPage = lazy(() => import('./pages/TasksPage'));
const ExamsPage = lazy(() => import('./pages/ExamsPage'));
const FlashcardsPage = lazy(() => import('./pages/FlashcardsPage'));
const SchedulePage = lazy(() => import('./pages/SchedulePage'));
const ChatPage = lazy(() => import('./pages/ChatPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const FriendsPage = lazy(() => import('./pages/FriendsPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));

function PageFallback() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 pt-6 md:px-6 lg:pt-9" aria-busy="true">
      <div className="skel h-8 w-56" />
      <div className="skel mt-4 h-4 w-80" />
      <div className="skel mt-8 h-40 w-full" />
    </div>
  );
}

function Protected({ children }) {
  return (
    <ProtectedRoute>
      <AppShell>{children}</AppShell>
    </ProtectedRoute>
  );
}

/** A signed-in visitor lands straight in the app instead of the marketing page. */
function Landing() {
  const { currentUser } = useAuth();
  if (currentUser) return <Navigate to="/dashboard" replace />;
  return <LandingPage />;
}

export default function App() {
  return (
    <BaseRouter>
      <AuthProvider>
        <I18nProvider>
          <SettingsProvider>
            <Suspense fallback={<PageFallback />}>
              <Routes>
                {/* Javne poti */}
                <Route path="/" element={<Landing />} />
                <Route path="/pravilnik-o-zasebnosti" element={<PrivacyPage />} />
                <Route path="/impressum" element={<ImprintPage />} />
                <Route path="/dostopnost" element={<AccessibilityPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />

                {/* Zaščitene poti */}
                <Route path="/dashboard" element={<Protected><DashboardPage /></Protected>} />
                <Route path="/subjects" element={<Protected><SubjectsPage /></Protected>} />
                <Route path="/tasks" element={<Protected><TasksPage /></Protected>} />
                <Route path="/schedule" element={<Protected><SchedulePage /></Protected>} />
                <Route path="/exams" element={<Protected><ExamsPage /></Protected>} />
                <Route path="/flashcards" element={<Protected><FlashcardsPage /></Protected>} />
                <Route path="/chat" element={<Protected><ChatPage /></Protected>} />
                <Route path="/profile" element={<Protected><ProfilePage /></Protected>} />
                <Route path="/settings" element={<Protected><SettingsPage /></Protected>} />
                <Route path="/friends" element={<Protected><FriendsPage /></Protected>} />

                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </SettingsProvider>
        </I18nProvider>
      </AuthProvider>
    </BaseRouter>
  );
}
