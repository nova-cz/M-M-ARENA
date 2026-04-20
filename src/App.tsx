import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppProvider } from './context/AppContext';

const Layout = lazy(() => import('./components/Layout'));
const Dashboard = lazy(() => import('./components/Dashboard'));
const LogWorkout = lazy(() => import('./components/LogWorkout'));
const History = lazy(() => import('./components/History'));
const Stats = lazy(() => import('./components/Stats'));
const Challenges = lazy(() => import('./components/Challenges'));
const Profile = lazy(() => import('./components/Profile'));
const Login = lazy(() => import('./components/Login'));
const SetupProfile = lazy(() => import('./components/SetupProfile'));

function PageSpinner() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="space-y-4 text-center">
        <h1 className="text-3xl font-heading animate-pulse">M&M ARENA</h1>
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
              <Route path="/stats" element={<Stats />} />
              <Route path="/challenges" element={<Challenges />} />
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
