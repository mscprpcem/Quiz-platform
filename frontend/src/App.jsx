import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import AdminLayout from './components/AdminLayout';

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
import AdminCourses from './pages/AdminCourses';
import AdminScheduledQuizzes from './pages/AdminScheduledQuizzes';
import ScheduledQuizDetails from './pages/ScheduledQuizDetails';
import ScheduledQuizTake from './pages/ScheduledQuizTake';
import CreateScheduledQuiz from './pages/CreateScheduledQuiz';
import VanityRedirect from './pages/VanityRedirect';

// Private Route Enforcer for Admin pages
const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-purple-600 font-extrabold text-sm">
        Authenticating...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/admin/login" replace />;
  }

  return <AdminLayout>{children}</AdminLayout>;
};

export default function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <Router>
          <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800 font-segoe">
            <Navbar />

            <main className="flex-grow">
              <Routes>
                {/* Public Participant Routes */}
                <Route path="/" element={<Home />} />
                <Route path="/join" element={<JoinQuiz />} />
                <Route path="/join/:joinCode" element={<JoinQuiz />} />
                <Route path="/waiting/:participantId" element={<WaitingRoom />} />
                <Route path="/live/:participantId" element={<LiveQuiz />} />
                <Route path="/results/:participantId" element={<Results />} />
                <Route path="/practice" element={<PracticeQuiz />} />
                <Route path="/practice/:category" element={<PracticeQuiz />} />
                <Route path="/courses" element={<Courses />} />
                <Route path="/scheduled-quiz/:occurrenceId" element={<ScheduledQuizTake />} />
                <Route path="/q/:slug" element={<VanityRedirect />} />
                <Route path="/:slug" element={<VanityRedirect />} />

                {/* Footer Policy Pages */}
                <Route path="/privacy" element={<PrivacyPolicy />} />
                <Route path="/terms" element={<TermsOfService />} />
                <Route path="/cookies" element={<CookiePolicy />} />
                <Route path="/code-of-conduct" element={<CodeOfConduct />} />
                <Route path="/disclaimer" element={<Disclaimer />} />
                <Route path="/accessibility" element={<AccessibilityStatement />} />
                <Route path="/rules" element={<QuizRules />} />
                <Route path="/faq" element={<FAQDetails />} />
                <Route path="/guide" element={<UserGuide />} />
                <Route path="/sla" element={<SupportSLA />} />
                <Route path="/report-issue" element={<ReportIssue />} />
                <Route path="/docs" element={<Documentation />} />

                {/* Admin Auth Route */}
                <Route path="/admin/login" element={<AdminLogin />} />

                {/* Protected Admin Routes */}
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
                  path="/admin/scheduled-quizzes"
                  element={
                    <AdminRoute>
                      <AdminScheduledQuizzes />
                    </AdminRoute>
                  }
                />
                <Route
                  path="/admin/scheduled-quizzes/create"
                  element={
                    <AdminRoute>
                      <CreateScheduledQuiz />
                    </AdminRoute>
                  }
                />
                <Route
                  path="/admin/scheduled-quizzes/edit/:id"
                  element={
                    <AdminRoute>
                      <CreateScheduledQuiz />
                    </AdminRoute>
                  }
                />
                <Route
                  path="/admin/scheduled-quizzes/:id"
                  element={
                    <AdminRoute>
                      <ScheduledQuizDetails />
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
                  path="/admin/run-quiz/:id"
                  element={
                    <AdminRoute>
                      <RunQuiz />
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
                <Route
                  path="/admin/courses"
                  element={
                    <AdminRoute>
                      <AdminCourses />
                    </AdminRoute>
                  }
                />

                {/* Fallback route */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>

            <Footer />
          </div>
        </Router>
      </SocketProvider>
    </AuthProvider>
  );
}
