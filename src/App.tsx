import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import logo from './img/logo.png';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppProvider } from './context/AppContext';

const Layout = lazy(() => import('./components/Layout'));
const Dashboard = lazy(() => import('./components/Dashboard'));
const LogWorkout = lazy(() => import('./components/LogWorkout'));
const History = lazy(() => import('./components/History'));

const Challenges = lazy(() => import('./components/Challenges'));
const ArenaDetail = lazy(() => import('./components/ArenaDetail'));
const Profile = lazy(() => import('./components/Profile'));
const Login = lazy(() => import('./components/Login'));
const SetupProfile = lazy(() => import('./components/SetupProfile'));

function PageSpinner() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="space-y-4 text-center">
        <img src={logo} alt="M&M Arena" className="h-12 mx-auto animate-pulse" />
        <div className="flex justify-center gap-1">
          {[0, 1, 2].map((i) => (
            <div key={i} className="w-2 h-2 bg-volt animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
          ))}
        </div>
      </div>
    </div>
  );
}

function AppRoutes() {
  const { firebaseUser, loading, needsProfileSetup } = useAuth();

  if (loading) return <PageSpinner />;

  if (!firebaseUser) {
    return <Suspense fallback={<PageSpinner />}><Login /></Suspense>;
  }

  if (needsProfileSetup) {
    return <Suspense fallback={<PageSpinner />}><SetupProfile /></Suspense>;
  }

  return (
    <AppProvider>
      <BrowserRouter>
        <Suspense fallback={<PageSpinner />}>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/history" element={<History />} />
              <Route path="/challenges" element={<Challenges />} />
              <Route path="/challenges/:arenaId" element={<ArenaDetail />} />
              <Route path="/profile/:userId" element={<Profile />} />
              <Route path="/profile" element={<Profile />} />
            </Route>
            <Route path="/log" element={<LogWorkout />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AppProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
