import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import {
  ArrowLeft,
  Plus,
  Edit2,
  Trash2,
  Clock,
  Award,
  CheckCircle,
  X
} from 'lucide-react';

export default function QuestionManagement() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [formError, setFormError] = useState('');

  // Form inputs state
  const [form, setForm] = useState({
    question: '',
    option_a: '',
    option_b: '',
    option_c: '',
    option_d: '',
    correct_answer: 'A',
    timer: 30,
    marks: 500
  });

  const loadQuizDetails = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/api/quizzes/${id}`);
      setQuiz(res.data);
    } catch (err) {
      console.error(err);
      navigate('/admin/quizzes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuizDetails();
  }, [id]);

  const handleOpenForm = (q = null) => {
    if (q) {
      setSelectedQuestion(q);
      setForm({
        question: q.question,
        option_a: q.option_a,
        option_b: q.option_b,
        option_c: q.option_c,
        option_d: q.option_d,
        correct_answer: q.correct_answer,
        timer: q.timer,
        marks: q.marks
      });
    } else {
      setSelectedQuestion(null);
      setForm({
        question: '',
        option_a: '',
        option_b: '',
        option_c: '',
        option_d: '',
        correct_answer: 'A',
        timer: 30,
        marks: 500
      });
    }
    setFormError('');
    setShowModal(true);
  };

  const handleSaveQuestion = async (e) => {
    e.preventDefault();
    if (!form.question || !form.option_a || !form.option_b || !form.option_c || !form.option_d) {
      setFormError('Please fill in the question and all four option choices.');
      return;
    }

    try {
      if (selectedQuestion) {
        // Edit Mode
        await api.put(`/api/quizzes/questions/${selectedQuestion.id}`, form);
      } else {
        // Add Mode
        await api.post(`/api/quizzes/${id}/questions`, form);
      }
      setShowModal(false);
      loadQuizDetails();
    } catch (err) {
      setFormError(err.response?.data?.error || 'Failed to save question.');
    }
  };

  const handleDeleteQuestion = async (qId) => {
    if (confirm('Are you sure you want to remove this question?')) {
      try {
        await api.delete(`/api/quizzes/questions/${qId}`);
        loadQuizDetails();
      } catch (err) {
        alert('Error deleting question.');
      }
    }
  };

  if (loading && !quiz) {
    return (
      <div className="text-center py-20 font-semibold text-zinc-500">
        Loading question list...
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center bg-white border border-microsoft-border p-6 rounded-xl shadow-sm">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/admin/quizzes')}
            className="p-2 border border-zinc-200 hover:bg-zinc-50 text-zinc-600 rounded-lg transition-all"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{quiz?.event_name}</span>
            <h1 className="text-2xl font-extrabold text-zinc-900 tracking-tight mt-0.5">{quiz?.title} Question Sheet</h1>
          </div>
        </div>
        
        <button
          onClick={() => handleOpenForm()}
          className="flex items-center space-x-1.5 bg-microsoft-blue hover:bg-microsoft-darkBlue text-white px-4 py-2.5 rounded-lg text-sm font-semibold shadow-sm transition-all cursor-pointer"
        >
          <Plus size={16} />
          <span>Add Question</span>
        </button>
      </div>

      {/* Questions list */}
      <div className="space-y-4">
        {quiz?.questions?.map((q, idx) => (
          <div
            key={q.id}
            className="bg-white border border-microsoft-border rounded-xl p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0"
          >
            <div className="space-y-3 flex-grow max-w-3xl pr-4">
              <div className="flex items-center space-x-3 text-xs font-semibold text-zinc-400">
                <span className="bg-zinc-100 px-2.5 py-0.5 rounded text-zinc-700 font-bold"># {idx + 1}</span>
                <span className="flex items-center"><Clock size={12} className="mr-1" /> {q.timer}s timer</span>
                <span className="flex items-center"><Award size={12} className="mr-1" /> {q.marks} pts</span>
              </div>

              <h3 className="text-lg font-bold text-zinc-800 leading-snug">{q.question}</h3>

              {/* Options mapping */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                {[
                  { key: 'A', text: q.option_a },
                  { key: 'B', text: q.option_b },
                  { key: 'C', text: q.option_c },
                  { key: 'D', text: q.option_d }
                ].map((opt) => {
                  const isCorrect = q.correct_answer === opt.key;
                  return (
                    <div
                      key={opt.key}
                      className={`p-2 rounded border flex items-center space-x-2 ${
                        isCorrect
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-800 font-bold'
                          : 'bg-zinc-50 border-zinc-100 text-zinc-600'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                        isCorrect ? 'bg-microsoft-success text-white' : 'bg-zinc-200 text-zinc-700'
                      }`}>
                        {opt.key}
                      </div>
                      <span className="truncate">{opt.text}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Actions panel */}
            <div className="flex space-x-2 flex-shrink-0">
              <button
                onClick={() => handleOpenForm(q)}
                className="flex items-center space-x-1 border border-zinc-200 hover:bg-zinc-50 text-zinc-600 px-3.5 py-2 rounded text-xs font-semibold transition-all"
              >
                <Edit2 size={12} />
                <span>Edit</span>
              </button>
              <button
                onClick={() => handleDeleteQuestion(q.id)}
                className="flex items-center space-x-1 bg-red-50 hover:bg-red-100 border border-red-100 text-red-600 px-3.5 py-2 rounded text-xs font-semibold transition-all"
              >
                <Trash2 size={12} />
                <span>Delete</span>
              </button>
            </div>
          </div>
        ))}

        {quiz?.questions?.length === 0 && (
          <div className="text-center py-20 bg-white border border-dashed border-zinc-200 rounded-xl text-zinc-400 text-sm">
            This quiz is currently empty. Click "Add Question" or import an Excel template to get started.
          </div>
        )}
      </div>

      {/* CREATE / EDIT MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-microsoft-border max-w-xl w-full shadow-2xl p-6 relative animate-fade-in max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-600"
            >
              <X size={20} />
            </button>

            <h3 className="text-xl font-bold text-zinc-800 border-b border-zinc-100 pb-3">
              {selectedQuestion ? 'Edit Question Details' : 'Add New Question'}
            </h3>

            {formError && (
              <div className="mt-4 bg-red-50 text-red-700 p-2.5 rounded text-xs">
                {formError}
              </div>
            )}

            <form onSubmit={handleSaveQuestion} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">
                  Question Text
                </label>
                <textarea
                  rows={2}
                  required
                  value={form.question}
                  onChange={(e) => setForm((prev) => ({ ...prev, question: e.target.value }))}
                  placeholder="Which Microsoft Azure service is used for serverless computing?"
                  className="w-full px-3 py-2 border border-zinc-200 rounded focus:outline-none focus:ring-2 focus:ring-microsoft-blue"
                ></textarea>
              </div>

              {/* Options */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">
                    Option A
                  </label>
                  <input
                    type="text"
                    required
                    value={form.option_a}
                    onChange={(e) => setForm((prev) => ({ ...prev, option_a: e.target.value }))}
                    placeholder="Azure VM"
                    className="w-full px-3 py-2 border border-zinc-200 rounded focus:outline-none focus:ring-2 focus:ring-microsoft-blue"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">
                    Option B
                  </label>
                  <input
                    type="text"
                    required
                    value={form.option_b}
                    onChange={(e) => setForm((prev) => ({ ...prev, option_b: e.target.value }))}
                    placeholder="Azure Functions"
                    className="w-full px-3 py-2 border border-zinc-200 rounded focus:outline-none focus:ring-2 focus:ring-microsoft-blue"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">
                    Option C
                  </label>
                  <input
                    type="text"
                    required
                    value={form.option_c}
                    onChange={(e) => setForm((prev) => ({ ...prev, option_c: e.target.value }))}
                    placeholder="Azure Kubernetes Service"
                    className="w-full px-3 py-2 border border-zinc-200 rounded focus:outline-none focus:ring-2 focus:ring-microsoft-blue"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">
                    Option D
                  </label>
                  <input
                    type="text"
                    required
                    value={form.option_d}
                    onChange={(e) => setForm((prev) => ({ ...prev, option_d: e.target.value }))}
                    placeholder="Azure Virtual Desktop"
                    className="w-full px-3 py-2 border border-zinc-200 rounded focus:outline-none focus:ring-2 focus:ring-microsoft-blue"
                  />
                </div>
              </div>

              {/* Details (Answers, Timers, Marks) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">
                    Correct Option
                  </label>
                  <select
                    value={form.correct_answer}
                    onChange={(e) => setForm((prev) => ({ ...prev, correct_answer: e.target.value }))}
                    className="w-full px-3 py-2 border border-zinc-200 rounded focus:outline-none focus:ring-2 focus:ring-microsoft-blue"
                  >
                    <option value="A">Option A</option>
                    <option value="B">Option B</option>
                    <option value="C">Option C</option>
                    <option value="D">Option D</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">
                    Timer (Seconds)
                  </label>
                  <input
                    type="number"
                    min={5}
                    max={300}
                    required
                    value={form.timer}
                    onChange={(e) => setForm((prev) => ({ ...prev, timer: parseInt(e.target.value, 10) }))}
                    className="w-full px-3 py-2 border border-zinc-200 rounded focus:outline-none focus:ring-2 focus:ring-microsoft-blue"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">
                    Points Weight
                  </label>
                  <input
                    type="number"
                    min={10}
                    max={5000}
                    required
                    value={form.marks}
                    onChange={(e) => setForm((prev) => ({ ...prev, marks: parseInt(e.target.value, 10) }))}
                    className="w-full px-3 py-2 border border-zinc-200 rounded focus:outline-none focus:ring-2 focus:ring-microsoft-blue"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-microsoft-blue hover:bg-microsoft-darkBlue text-white font-semibold py-2.5 rounded transition-all shadow-sm active:scale-98 cursor-pointer"
              >
                Save Question Specs
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
