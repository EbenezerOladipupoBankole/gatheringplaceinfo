
import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import AttendanceForm from './components/AttendanceForm';
import AdminDashboard from './components/AdminDashboard';
import { ViewMode } from './types';
import { auth } from './services/firebaseConfig';
import { GoogleAuthProvider, signInWithPopup, signOut, signInAnonymously, User } from 'firebase/auth';
import logo from './image.png';

const SPIRITUAL_QUOTES = [
  {
    text: "And behold, ye shall meet together oft...",
    source: "3 Nephi 18:22",
    context: "A Commandment to Gather"
  },
  {
    text: "For where two or three are gathered together in my name, there am I in the midst of them.",
    source: "Matthew 18:20",
    context: "The Promise of Presence"
  },
  {
    text: "And they were all with one accord in one place.",
    source: "Acts 2:1",
    context: "The Power of Unity"
  },
  {
    text: "It is expedient that the church should meet together often to partake of bread and wine...",
    source: "D&C 20:75",
    context: "Strength in Fellowship"
  },
  {
    text: "Then they that feared the Lord spake often one to another: and the Lord hearkened, and heard it.",
    source: "Malachi 3:16",
    context: "Sacred Conversation"
  },
  {
    text: "Gathering is the beginning of belonging.",
    source: "Gathering Place Mission",
    context: "Our Vision"
  }
];

const ALLOWED_ADMINS = [
  "bankoleebenezer111@gmail.com",      // <--- Put your exact Google email here
  "samidowu2001@gmail.com",    // <--- Put the 2nd admin's email here
  "ife.victor1830@gmail.com",      // <--- Put the 3rd admin's email here
  "oluemmy29@gmail.com",
  "moshoodoyeniran09@gmail.com",
  "boluwatifev66@gmail.com",
  "jineepinee@gmail.com"
];

const App: React.FC = () => {
  const [view, setView] = useState<ViewMode>(ViewMode.USER_FORM);
  const [authError, setAuthError] = useState('');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [fadeTrigger, setFadeTrigger] = useState(true);
  const [selectedProgram, setSelectedProgram] = useState<string | null>(null);

  // Quote rotation logic
  useEffect(() => {
    if (view !== ViewMode.USER_FORM) return;

    const interval = setInterval(() => {
      setFadeTrigger(false);
      setTimeout(() => {
        setQuoteIndex((prev) => (prev + 1) % SPIRITUAL_QUOTES.length);
        setFadeTrigger(true);
      }, 800);
    }, 8000);

    return () => clearInterval(interval);
  }, [view]);

  const handleAdminLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const email = result.user.email;

      if (email && ALLOWED_ADMINS.includes(email)) {
        setCurrentUser(result.user);
        setView(ViewMode.ADMIN_DASHBOARD);
        setAuthError('');
      } else {
        await signOut(auth);
        setAuthError('Access Denied: You are not authorized as an admin.');
      }
    } catch (error) {
      setAuthError('Login failed. Please try again.');
    }
  };

  const renderContent = () => {
    switch (view) {
      case ViewMode.USER_FORM:
        if (selectedProgram) {
          let eventType: 'Friday Gathering' | 'Skills Acquisition' | 'Institute Cluster' | 'Missionary Preparatory Class' = 'Friday Gathering';
          if (selectedProgram === 'skills') eventType = 'Skills Acquisition';
          else if (selectedProgram === 'cluster') eventType = 'Institute Cluster';
          else if (selectedProgram === 'missionary') eventType = 'Missionary Preparatory Class';

          return (
            <div className="w-full min-h-[calc(100vh-80px)] flex flex-col items-center justify-center py-8 px-4 relative z-10 bg-slate-50">
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-100/50 blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-amber-100/50 blur-[120px]" />
              </div>
              <button 
                onClick={() => setSelectedProgram(null)}
                className="mb-8 px-6 py-3 rounded-full bg-white hover:bg-slate-50 text-slate-900 transition-all flex items-center gap-2 font-bold text-sm border border-slate-200 shadow-sm hover:shadow-md relative z-20"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 12H5M12 19l-7-7 7-7"/>
                </svg>
                Back to Programs
              </button>
              <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-8 duration-700">
                <AttendanceForm preselectedEvent={eventType} />
              </div>
            </div>
          );
        }

        return (
          <div className="w-full min-h-[calc(100vh-80px)] flex flex-col items-center py-24 px-4 sm:px-6 lg:px-8 relative z-10 bg-slate-50">
            {/* Enterprise Background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
               <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-100 via-slate-50 to-slate-50 opacity-80"></div>
               <div className="absolute inset-0 opacity-[0.4]" style={{ backgroundImage: 'linear-gradient(#cbd5e1 1px, transparent 1px), linear-gradient(to right, #cbd5e1 1px, transparent 1px)', backgroundSize: '40px 40px', maskImage: 'linear-gradient(to bottom, black 40%, transparent 100%)', WebkitMaskImage: 'linear-gradient(to bottom, black 40%, transparent 100%)' }}></div>
            </div>

            <div className="w-full max-w-7xl mx-auto relative z-20">
                {/* Header Section */}
                <div className="text-center max-w-3xl mx-auto mb-20 space-y-8 animate-in fade-in slide-in-from-top-8 duration-1000">
                   <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow cursor-default">
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                      </span>
                      <span className="text-[11px] font-black text-slate-600 uppercase tracking-widest">Abeokuta Nigeria Stake</span>
                   </div>
                   
                   <div>
                     <h1 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tight leading-[1.1] mb-6">
                       The Gathering Place
                     </h1>
                     <p className="text-xl text-slate-500 font-medium max-w-2xl mx-auto leading-relaxed">
                       A dedicated space for strengthening faith, fostering unity, and developing self-reliance among Young Single Adults.
                     </p>
                   </div>
                </div>

                {/* Enterprise Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[
                    {
                      id: 'skills',
                      title: 'Skills Acquisition',
                      day: 'Tuesday',
                      sub: 'Vocational Training',
                      img: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=800&auto=format&fit=crop&q=60',
                      desc: 'Hands-on workshops including Barbing, ICT, Catering, and more.',
                      icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                    },
                    {
                      id: 'cluster',
                      title: 'Institute Cluster',
                      day: 'Thursday',
                      sub: 'Odeda, Obantoko & Kuto',
                      img: 'https://images.unsplash.com/photo-1529070538774-1843cb3265df?w=800&auto=format&fit=crop&q=60',
                      desc: 'Localized institute gatherings for brethren and sisters in cluster areas.',
                      icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                    },
                    {
                      id: 'institute',
                      title: 'Institute of Religion',
                      day: 'Friday',
                      sub: 'General Assembly',
                      img: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=800&auto=format&fit=crop&q=60',
                      desc: 'Weekly spiritual instruction and social gathering for all YSAs.',
                      icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                    },
                    {
                      id: 'missionary',
                      title: 'Missionary Prep',
                      day: 'Saturday',
                      sub: 'Prospective Missionaries',
                      img: 'https://images.unsplash.com/photo-1491841550275-ad7854e35ca6?w=800&auto=format&fit=crop&q=60',
                      desc: 'Specialized preparation class for future full-time missionaries.',
                      icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    }
                  ].map((program, idx) => (
                    <button
                      key={program.id}
                      onClick={() => setSelectedProgram(program.id)}
                      className="group relative flex flex-col bg-white rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-2xl hover:shadow-slate-200/50 hover:border-indigo-100 transition-all duration-500 overflow-hidden text-left h-full animate-in fade-in slide-in-from-bottom-8"
                      style={{ animationDelay: `${idx * 100}ms` }}
                    >
                      <div className="h-48 w-full overflow-hidden relative">
                        <div className="absolute inset-0 bg-slate-900/10 group-hover:bg-slate-900/0 transition-colors z-10" />
                        <img 
                          src={program.img} 
                          alt={program.title}
                          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                        <div className="absolute top-4 right-4 z-20">
                          <span className="px-3 py-1 rounded-full bg-white/90 backdrop-blur-md text-slate-900 text-[10px] font-black uppercase tracking-widest shadow-sm border border-white/20">
                            {program.day}
                          </span>
                        </div>
                      </div>
                      <div className="p-8 flex flex-col flex-1">
                        <div className="mb-6">
                          <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-600 mb-6 group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-600 transition-all duration-300 shadow-sm">
                            {program.icon}
                          </div>
                          <h3 className="text-2xl font-black text-slate-900 mb-2 tracking-tight group-hover:text-indigo-600 transition-colors">
                            {program.title}
                          </h3>
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                            {program.sub}
                          </p>
                        </div>
                        <p className="text-slate-500 text-sm leading-relaxed font-medium mb-8">
                          {program.desc}
                        </p>
                        <div className="mt-auto flex items-center gap-2 text-indigo-600 font-black text-xs uppercase tracking-widest group-hover:gap-3 transition-all">
                          Check In Now
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                          </svg>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
            </div>
          </div>
        );

      case ViewMode.ADMIN_LOGIN:
        return (
          <div className="min-h-[calc(100vh-80px)] flex items-center justify-center py-12 px-4 bg-white">
            <div className="w-full max-w-md bg-white p-12 rounded-[3.5rem] border border-slate-200 shadow-2xl">
              <h2 className="text-3xl font-black text-slate-900 mb-2 text-center tracking-tight">Admin Dashboard</h2>
              <p className="text-slate-500 mb-12 text-center font-semibold">Priesthood leader Only</p>
              
              <div className="space-y-8">
                {authError && <p className="text-red-600 text-xs font-black text-center animate-bounce">{authError}</p>}
                <button 
                  onClick={handleAdminLogin}
                  className="w-full bg-slate-50 hover:bg-slate-100 text-slate-900 border border-slate-200 font-black py-5 px-4 rounded-[1.5rem] shadow-lg transition-all active:scale-[0.98] uppercase tracking-[0.2em] text-sm flex items-center justify-center gap-4"
                >
                  <svg className="w-6 h-6" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  Sign in with Google
                </button>
              </div>
            </div>
          </div>
        );

      case ViewMode.ADMIN_DASHBOARD:
        return <AdminDashboard user={currentUser} />;
        
      default:
        return <AttendanceForm />;
    }
  };

  return (
    <Layout 
      currentView={view} 
      onNavigate={(v) => {
        if (v === ViewMode.ADMIN_LOGIN && view === ViewMode.ADMIN_DASHBOARD) return;
        setView(v);
      }}
    >
      {renderContent()}
    </Layout>
  );
};

export default App;
