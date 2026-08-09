import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

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
import RunQuiz from './pages/RunQuiz';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import CookiePolicy from './pages/CookiePolicy';
import CodeOfConduct from './pages/CodeOfConduct';
import Disclaimer from './pages/Disclaimer';
import AccessibilityStatement from './pages/AccessibilityStatement';
import QuizRules from './pages/QuizRules';
import FAQDetails from './pages/FAQDetails';
import UserGuide from './pages/UserGuide';
import SupportSLA from './pages/SupportSLA';
import ReportIssue from './pages/ReportIssue';
import Documentation from './pages/Documentation';
import Courses from './pages/Courses';
import WeeklyLeague from './pages/WeeklyLeague';
import WeeklyLeagueQuiz from './pages/WeeklyLeagueQuiz';
import AdminWeeklyLeague from './pages/AdminWeeklyLeague';
import AdminCourses from './pages/AdminCourses';
import AdminLayout from './components/AdminLayout';

// Private Route Enforcer for Admin pages
const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-brand-textMuted font-semibold">
        Validating session token...
      </div>
    );
  }

  return user ? <AdminLayout>{children}</AdminLayout> : <Navigate to="/admin/login" replace />;
};

export default function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <Router>
          <div className="min-h-screen flex flex-col font-segoe" style={{ backgroundColor: '#F5FAFF' }}>
            {/* Header navbar is shown globally */}
            <Navbar />

            {/* Page Router boundaries */}
            <main className="flex-grow">
              <Routes>
                {/* Participant Routes */}
                <Route path="/" element={<Home />} />
                <Route path="/join" element={<JoinQuiz />} />
                <Route path="/join/:code" element={<JoinQuiz />} />
                <Route path="/courses" element={<Courses />} />
                <Route path="/weekly-league" element={<WeeklyLeague />} />
                <Route path="/weekly-league/quiz/:attemptId" element={<WeeklyLeagueQuiz />} />
                <Route path="/waiting-room" element={<WaitingRoom />} />
                <Route path="/live-quiz" element={<LiveQuiz />} />
                <Route path="/results" element={<Results />} />
                <Route path="/practice" element={<PracticeQuiz />} />
                <Route path="/practice/:category" element={<PracticeQuiz />} />
                <Route path="/privacy" element={<PrivacyPolicy />} />
                <Route path="/terms" element={<TermsOfService />} />
                <Route path="/cookies" element={<CookiePolicy />} />
                <Route path="/code-of-conduct" element={<CodeOfConduct />} />
                <Route path="/disclaimer" element={<Disclaimer />} />
                <Route path="/accessibility" element={<AccessibilityStatement />} />
                <Route path="/rules" element={<QuizRules />} />
                <Route path="/faq-details" element={<FAQDetails />} />
                <Route path="/user-guide" element={<UserGuide />} />
                <Route path="/support-sla" element={<SupportSLA />} />
                <Route path="/report-issue" element={<ReportIssue />} />
                <Route path="/documentation" element={<Documentation />} />

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
                  path="/admin/run-quiz/:id"
                  element={
                    <AdminRoute>
                      <RunQuiz />
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
                  path="/admin/weekly-league"
                  element={
                    <AdminRoute>
                      <AdminWeeklyLeague />
                    </AdminRoute>
                  }
                />
                <Route
                  path="/admin/courses"
                  element={
                    <AdminRoute>
                      <AdminCourses />
                    </AdminRoute>
                  }
                />
                <Route
                  path="/admin/analytics"
                  element={
                    <AdminRoute>
                      <Analytics />
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

            {/* Footer */}
            <Footer />
          </div>
        </Router>
      </SocketProvider>
    </AuthProvider>
  );
}
