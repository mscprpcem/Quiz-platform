import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BookOpen, Plus, Edit, Trash2, Bell, CheckCircle, Clock, 
  Search, ShieldAlert, Award, FileCode, ArrowLeft, RefreshCw 
} from 'lucide-react';
import api from '../services/api';

export default function AdminCourses() {
  const navigate = useNavigate();

  const [courses, setCourses] = useState([
    { id: 'dbms', title: 'Database Management Systems (DBMS)', category: 'Core CS', quizzesCount: 12, status: 'Active', notifyOnly: true },
    { id: 'dsa', title: 'Data Structures & Algorithms', category: 'Programming', quizzesCount: 24, status: 'Active', notifyOnly: false },
    { id: 'azure', title: 'Microsoft Azure & Cloud Essentials', category: 'Cloud', quizzesCount: 8, status: 'Active', notifyOnly: false },
    { id: 'web', title: 'Full Stack Web Development', category: 'Development', quizzesCount: 18, status: 'Active', notifyOnly: false },
    { id: 'ai', title: 'AI & Machine Learning Fundamentals', category: 'AI', quizzesCount: 10, status: 'Active', notifyOnly: false },
    { id: 'cn', title: 'Computer Networks (CN)', category: 'Core CS', quizzesCount: 15, status: 'Active', notifyOnly: true }
  ]);

  const [notifications, setNotifications] = useState([]);
  const [showAddCourseModal, setShowAddCourseModal] = useState(false);
  const [newCourse, setNewCourse] = useState({ title: '', category: 'Core CS', description: '', notifyOnly: false });

  const handleCreateCourse = (e) => {
    e.preventDefault();
    const created = {
      id: newCourse.title.toLowerCase().replace(/\s+/g, '-'),
      title: newCourse.title,
      category: newCourse.category,
      quizzesCount: 0,
      status: 'Active',
      notifyOnly: newCourse.notifyOnly
    };
    setCourses([...courses, created]);
    setShowAddCourseModal(false);
    setNewCourse({ title: '', category: 'Core CS', description: '', notifyOnly: false });
  };

  const handleToggleNotifyMode = (courseId) => {
    setCourses(courses.map(c => c.id === courseId ? { ...c, notifyOnly: !c.notifyOnly } : c));
  };

  return (
    <div className="space-y-8 text-left font-segoe">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Courses & Subject Quizzes Management
          </h1>
          <p className="text-xs text-slate-500 font-medium">Manage subject categories, notify-only toggles, and bound course materials.</p>
        </div>

        <button
          onClick={() => setShowAddCourseModal(true)}
          className="px-4 py-2.5 bg-brand-blue hover:bg-blue-700 text-white rounded-xl font-extrabold text-xs shadow-sm transition-all flex items-center space-x-2 cursor-pointer self-start sm:self-auto"
        >
          <Plus size={16} />
          <span>Add New Subject / Course</span>
        </button>
      </div>

      {/* Courses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((course) => (
          <div key={course.id} className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col justify-between space-y-4 shadow-sm hover:shadow-md transition-all">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded bg-blue-50 text-brand-blue">
                  {course.category}
                </span>
                <button
                  onClick={() => handleToggleNotifyMode(course.id)}
                  className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider cursor-pointer ${
                    course.notifyOnly ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {course.notifyOnly ? 'Notify Only' : 'Active Quizzes'}
                </button>
              </div>

              <div>
                <h3 className="text-base font-extrabold text-slate-900">{course.title}</h3>
                <p className="text-xs text-slate-500 mt-1">{course.quizzesCount} Questions & Quizzes Attached</p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl text-[11px] font-bold space-y-1">
                <div className="flex justify-between text-slate-600">
                  <span>Access Mode:</span>
                  <span className={course.notifyOnly ? 'text-amber-600' : 'text-emerald-600'}>
                    {course.notifyOnly ? 'Notify Me Only' : 'Open Registration'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2 pt-2">
              <button
                onClick={() => navigate('/admin/quizzes')}
                className="flex-1 py-2 bg-slate-100 hover:bg-brand-blue hover:text-white text-slate-700 font-bold rounded-xl text-xs transition-all flex items-center justify-center space-x-1 cursor-pointer"
              >
                <Edit size={14} />
                <span>Manage Quizzes</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Course Modal */}
      {showAddCourseModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl space-y-6 text-left">
            <h3 className="text-xl font-black text-slate-900">Add New Course / Subject</h3>

            <form onSubmit={handleCreateCourse} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-500 uppercase">Course Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Cybersecurity & Ethical Hacking"
                  value={newCourse.title}
                  onChange={e => setNewCourse({ ...newCourse, title: e.target.value })}
                  className="w-full border rounded-xl px-4 py-2.5 text-xs font-bold bg-slate-50"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-500 uppercase">Category *</label>
                <select
                  value={newCourse.category}
                  onChange={e => setNewCourse({ ...newCourse, category: e.target.value })}
                  className="w-full border rounded-xl px-3 py-2.5 text-xs font-bold bg-slate-50"
                >
                  <option value="Core CS">Core CS</option>
                  <option value="Programming">Programming</option>
                  <option value="Cloud">Cloud</option>
                  <option value="Development">Development</option>
                  <option value="AI">AI & Data</option>
                  <option value="Cybersecurity">Cybersecurity</option>
                </select>
              </div>

              <label className="flex items-center space-x-2 text-xs font-bold text-slate-700 cursor-pointer pt-2">
                <input
                  type="checkbox"
                  checked={newCourse.notifyOnly}
                  onChange={e => setNewCourse({ ...newCourse, notifyOnly: e.target.checked })}
                />
                <span>Set as "Notify Me Later" mode (quizzes hidden until ready)</span>
              </label>

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowAddCourseModal(false)}
                  className="px-4 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-brand-blue text-white font-extrabold rounded-xl text-xs cursor-pointer"
                >
                  Create Course
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
