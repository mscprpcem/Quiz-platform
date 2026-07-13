import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import Navbar from './components/Navbar';

// Page Imports
import Home from './pages/Home';
import JoinQuiz from './pages/JoinQuiz';
import WaitingRoom from './pages/WaitingRoom';
import LiveQuiz from './pages/LiveQuiz';
import Results from './pages/Results';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import QuizManagement from './pages/QuizManagement';
import QuestionManagement from './pages/QuestionManagement';
import Analytics from './pages/Analytics';
import PracticeQuiz from './pages/PracticeQuiz';

// Private Route Enforcer for Admin pages
const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-zinc-500 font-semibold">
        Validating session token...
      </div>
    );
  }

  return user ? children : <Navigate to="/admin/login" replace />;
};

export default function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <Router>
          <div className="min-h-screen bg-zinc-50 flex flex-col font-segoe">
            {/* Header navbar is shown globally */}
            <Navbar />

            {/* Page Router boundaries */}
            <main className="flex-grow">
              <Routes>
                {/* Participant Routes */}
                <Route path="/" element={<Home />} />
                <Route path="/join" element={<JoinQuiz />} />
                <Route path="/join/:code" element={<JoinQuiz />} />
                <Route path="/waiting-room" element={<WaitingRoom />} />
                <Route path="/live-quiz" element={<LiveQuiz />} />
                <Route path="/results" element={<Results />} />
                <Route path="/practice" element={<PracticeQuiz />} />
                <Route path="/practice/:category" element={<PracticeQuiz />} />

                {/* Admin Auth Routes */}
                <Route path="/admin/login" element={<AdminLogin />} />

                {/* Admin Dashboard & Management Routes (Protected) */}
                <Route
                  path="/admin/dashboard"
                  element={
                    <AdminRoute>
                      <AdminDashboard />
                    </AdminRoute>
                  }
                />
                <Route
                  path="/admin/quizzes"
                  element={
                    <AdminRoute>
                      <QuizManagement />
                    </AdminRoute>
                  }
                />
                <Route
                  path="/admin/quizzes/:id"
                  element={
                    <AdminRoute>
                      <QuestionManagement />
                    </AdminRoute>
                  }
                />
                <Route
                  path="/admin/analytics/:id"
                  element={
                    <AdminRoute>
                      <Analytics />
                    </AdminRoute>
                  }
                />

                {/* Fallback route */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
          </div>
        </Router>
      </SocketProvider>
    </AuthProvider>
  );
}
