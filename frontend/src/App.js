import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import NoteEditor from './pages/NoteEditor';
import AIAssistant from './pages/AIAssistant';
import Search from './pages/Search';
import Login from './pages/Login';
import Register from './pages/Register';
import ErrorBoundary from './components/ErrorBoundary';
import { NotesProvider } from './context/NotesContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoadingScreen } from './components/LoadingSpinner';

// Protected Route Component
function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return <LoadingScreen />;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <ErrorBoundary>{children}</ErrorBoundary>;
}

// Public Route Component (redirect to home if logged in)
function PublicRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return <LoadingScreen />;
  }
  
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={
        <PublicRoute>
          <Login />
        </PublicRoute>
      } />
      <Route path="/register" element={
        <PublicRoute>
          <Register />
        </PublicRoute>
      } />
      
      {/* Protected Routes */}
      <Route path="/" element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }>
        <Route index element={<Dashboard />} />
        <Route path="note/new" element={<NoteEditor />} />
        <Route path="note/:id" element={<NoteEditor />} />
        <Route path="ai" element={<AIAssistant />} />
        <Route path="search" element={<Search />} />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <NotesProvider>
        <Router>
          <div className="min-h-screen bg-secondary-50">
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 3000,
                style: {
                  background: '#1e293b',
                  color: '#f8fafc',
                  borderRadius: '0.75rem',
                  padding: '12px 16px',
                },
                success: {
                  iconTheme: {
                    primary: '#22c55e',
                    secondary: '#f8fafc',
                  },
                },
                error: {
                  iconTheme: {
                    primary: '#ef4444',
                    secondary: '#f8fafc',
                  },
                },
              }}
            />
            <AppRoutes />
          </div>
        </Router>
      </NotesProvider>
    </AuthProvider>
  );
}

export default App;
