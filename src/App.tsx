import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from '@/context/AppContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { LoginPage } from '@/pages/LoginPage';
import { UsersPage } from '@/pages/UsersPage';
import { TripPage } from '@/pages/TripPage';
import { StylePage } from '@/pages/StylePage';
import { MoodPage } from '@/pages/MoodPage';
import { storage } from '@/lib/storage';

storage.ensureDefaultAdminUser();

function App() {
  return (
    <AppProvider>
      <Router>
        <Routes>
          {/* Public route */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protected routes */}
          <Route
            path="/users"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <UsersPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/trip"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <TripPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/mood"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <MoodPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/style"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <StylePage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          {/* Redirect root to users */}
          <Route path="/" element={<Navigate to="/users" replace />} />

          {/* Catch all - redirect to users */}
          <Route path="*" element={<Navigate to="/users" replace />} />
        </Routes>
      </Router>
    </AppProvider>
  );
}

export default App;
