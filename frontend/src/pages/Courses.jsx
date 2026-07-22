import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Sparkles, Clock, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function Courses() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (!email) return;
    setSubscribed(true);
    setEmail('');
  };

  const upcomingCourses = [
    {
      title: 'Microsoft Azure',
      category: 'Cloud Infrastructure',
      desc: 'Master Microsoft Azure cloud services, virtual machines, resource management, and AZ-900 exam preparation.',
      imageSrc: '/azure.png',
      color: 'from-blue-50/80 to-indigo-50/50 border-blue-200/80',
      imgClass: 'object-contain',
      paddingClass: 'p-2',
      badge: 'Coming Soon'
    },
    {
      title: 'Azure AI',
      category: 'Artificial Intelligence',
      desc: 'Explore Azure OpenAI, Cognitive Services, Computer Vision, and natural language processing solutions.',
      imageSrc: '/azure-ai-foundry-logo.jpg',
      color: 'from-purple-50/80 to-indigo-50/50 border-purple-200/80',
      imgClass: 'object-cover w-full h-full scale-105',
      paddingClass: 'p-0',
      badge: 'Coming Soon'
    },
    {
      title: 'Computer Fundamentals',
      category: 'Core Computer Science',
      desc: 'Build rock-solid foundations in operating systems, computer architecture, memory management, and networking.',
      imageSrc: '/microsoft-copilot.png',
      color: 'from-amber-50/80 to-orange-50/50 border-amber-200/80',
      imgClass: 'object-contain',
      paddingClass: 'p-2',
      badge: 'Coming Soon'
    },
    {
      title: 'Database (SQL)',
      category: 'Database Systems',
      desc: 'Learn relational database design, SQL querying, indexing, normalized schema design, and transaction management.',
      imageSrc: '/database.svg',
      color: 'from-emerald-50/80 to-teal-50/50 border-emerald-200/80',
      imgClass: 'object-contain',
      paddingClass: 'p-2.5',
      badge: 'Coming Soon'
    },
    {
      title: 'Git & GitHub',
      category: 'Version Control & Open Source',
      desc: 'Master Git branching, pull requests, merge conflict resolution, CI/CD workflows, and open-source collaboration.',
      imageSrc: '/github.svg',
      color: 'from-rose-50/80 to-pink-50/50 border-rose-200/80',
      imgClass: 'object-contain',
      paddingClass: 'p-2.5',
      badge: 'Coming Soon'
    }
  ];

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col justify-between bg-[#F5FAFF] relative overflow-hidden py-10 sm:py-16 px-4 sm:px-6">
      
      {/* Background Mesh Glows */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-blue-400/15 blur-[120px] animate-pulse"></div>
        <div className="absolute top-[30%] right-[-10%] w-[450px] h-[450px] rounded-full bg-indigo-400/15 blur-[120px]"></div>
        <div className="absolute bottom-[-10%] left-[20%] w-[500px] h-[500px] rounded-full bg-purple-400/10 blur-[140px]"></div>
      </div>

      <div className="max-w-5xl mx-auto w-full space-y-12 relative z-10 text-center">

        {/* Hero Header */}
        <div className="space-y-4 max-w-2xl mx-auto">
          <div className="inline-flex items-center space-x-2 bg-brand-lightBlue text-brand-blue border border-brand-blue/20 px-4 py-1.5 rounded-full text-xs font-extrabold shadow-sm">
            <Sparkles size={14} className="animate-pulse" />
            <span>MSC-PRPCEM Learning Hub</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-brand-textMain tracking-tight leading-tight">
            Interactive Courses <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">
              Coming Soon
            </span>
          </h1>

          <p className="text-sm sm:text-base text-brand-textMuted leading-relaxed font-medium">
            We are curating comprehensive technical courses, certification prep materials, and hands-on developer workshops for MSC-PRPCEM students.
          </p>
        </div>

        {/* Notify Me Form */}
        <div className="max-w-md mx-auto bg-white border border-brand-border p-6 rounded-2xl shadow-soft text-left space-y-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-brand-blue flex items-center justify-center border border-blue-100">
              <Clock size={18} />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-brand-textMain">Get Early Access Notification</h3>
              <p className="text-[11px] text-brand-textMuted">Be the first to know when new courses open for enrollment.</p>
            </div>
          </div>

          {subscribed ? (
            <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-xl text-emerald-800 text-xs font-bold flex items-center space-x-2 animate-fade-in">
              <CheckCircle2 size={16} className="text-emerald-600 flex-shrink-0" />
              <span>You're on the early access list! We will notify you upon course releases.</span>
            </div>
          ) : (
            <form onSubmit={handleSubscribe} className="flex gap-2">
              <input
                type="email"
                required
                placeholder="Enter student email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-brand-textMain focus:outline-none focus:border-brand-blue bg-slate-50/50"
              />
              <button
                type="submit"
                className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-extrabold shadow-sm transition-all whitespace-nowrap cursor-pointer active:scale-95"
              >
                Notify Me
              </button>
            </form>
          )}
        </div>

        {/* Upcoming Courses Preview Grid */}
        <div className="space-y-6 text-left">
          <div className="flex justify-between items-center border-b border-brand-border pb-3">
            <h3 className="text-lg font-black text-brand-textMain">Upcoming Learning Tracks</h3>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-brand-blue bg-brand-lightBlue px-3 py-1 rounded-full border border-brand-blue/15">
              Official Curriculums
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {upcomingCourses.map((course, idx) => {
              return (
                <div
                  key={idx}
                  className={`bg-gradient-to-br ${course.color} border rounded-2xl p-6 shadow-soft hover:shadow-soft-lg hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between space-y-4 group relative overflow-hidden`}
                >
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform duration-300 border border-slate-200/80 overflow-hidden ${course.paddingClass || 'p-2'}`}>
                        <img src={course.imageSrc} alt={course.title} className={course.imgClass || 'object-contain w-full h-full'} />
                      </div>
                      <span className="text-[10px] font-extrabold text-amber-800 bg-amber-100/80 border border-amber-200 px-3 py-0.5 rounded-full uppercase tracking-wider">
                        {course.badge}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-brand-blue uppercase tracking-widest block">{course.category}</span>
                      <h4 className="text-base font-extrabold text-brand-textMain mt-0.5">{course.title}</h4>
                      <p className="text-xs text-brand-textMuted mt-1.5 leading-relaxed font-medium">
                        {course.desc}
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200/60 flex justify-between items-center text-xs font-bold text-slate-500">
                    <span>Includes verified certificate</span>
                    <span className="text-brand-blue font-extrabold">Stay tuned →</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Back to Home CTA */}
        <div className="pt-4">
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center space-x-2 text-xs font-extrabold text-brand-blue hover:underline cursor-pointer"
          >
            <span>Return to Homepage</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
