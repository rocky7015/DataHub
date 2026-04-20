import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth, AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

import HomePage          from './pages/HomePage';
import LoginPage         from './pages/LoginPage';
import RegisterPage      from './pages/RegisterPage';
import SearchPage        from './pages/SearchPage';
import DatasetDetailPage from './pages/DatasetDetailPage';
import UploadPage        from './pages/UploadPage';
import ProfilePage       from './pages/ProfilePage';
import DashboardPage     from './pages/DashboardPage';
import AdminDashboard    from './pages/AdminDashboard';

const AdminRoute = ({ children }) => {
  const { user, isAuthenticated, loading } = useAuth();
  if (loading) return null;
  return isAuthenticated && user?.role === 'admin' ? children : <Navigate to="/" replace />;
};

const App = () => (
  <BrowserRouter>
    <AuthProvider>
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1">
          <Routes>
            <Route path="/"              element={<HomePage />} />
            <Route path="/login"         element={<LoginPage />} />
            <Route path="/register"      element={<RegisterPage />} />
            <Route path="/search"        element={<SearchPage />} />
            <Route path="/dataset/:id"   element={<DatasetDetailPage />} />
            <Route path="/profile/:username" element={<ProfilePage />} />
            <Route path="/upload"    element={<ProtectedRoute><UploadPage /></ProtectedRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
            <Route path="/admin"     element={<AdminRoute><AdminDashboard /></AdminRoute>} />
            {/* 404 */}
            <Route path="*" element={
              <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
                <h1 className="text-6xl font-bold gradient-text">404</h1>
                <p className="text-gray-400">Page not found</p>
                <a href="/" className="btn-primary">Go Home</a>
              </div>
            } />
          </Routes>
        </main>
        <Footer />
      </div>
    </AuthProvider>
  </BrowserRouter>
);

export default App;
