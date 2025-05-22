import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { lazy, Suspense } from 'react';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Layout from './components/layout/Layout';
import LoadingScreen from './components/ui/LoadingScreen';

// Lazy loaded components
const LoginPage = lazy(() => import('./pages/LoginPage'));
const VanMasterPage = lazy(() => import('./pages/VanMasterPage'));
const VanInventoryPage = lazy(() => import('./pages/VanInventoryPage'));
const KilometerEntryPage = lazy(() => import('./pages/KilometerEntryPage'));
const StoppageEntryPage = lazy(() => import('./pages/StoppageEntryPage'));
const ReportsPage = lazy(() => import('./pages/ReportsPage'));

function App() {
  return (
    <AuthProvider>
      <Router>
        <Suspense fallback={<LoadingScreen />}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
              <Route index element={<Navigate to="/login" replace />} />
              <Route path="vans" element={<VanMasterPage />} />
              <Route path="inventory" element={<VanInventoryPage />} />
              <Route path="kilometers" element={<KilometerEntryPage />} />
              <Route path="stoppages" element={<StoppageEntryPage />} />
              <Route path="reports" element={<ReportsPage />} />
            </Route>
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </Suspense>
      </Router>
    </AuthProvider>
  );
}

export default App;