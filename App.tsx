
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
  "ife.victor1830@gmail.com"      // <--- Put the 3rd admin's email here
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
          <div className="w-full min-h-[calc(100vh-80px)] flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative z-10 bg-slate-50">
            {/* Background Ambience */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
               <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl">
                  <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-indigo-200/20 blur-[120px] mix-blend-multiply" />
                  <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-amber-200/20 blur-[120px] mix-blend-multiply" />
               </div>
               <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: 'radial-gradient(#1e293b 1px, transparent 1px)', backgroundSize: '32px 32px' }}></div>
            </div>

            {/* Header Section */}
            <div className="text-center max-w-3xl mx-auto mb-16 space-y-6 animate-in fade-in slide-in-from-top-8 duration-1000">
               <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-indigo-100 text-indigo-700 shadow-sm relative z-20">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-widest">Abeokuta Nigeria Stake</span>
               </div>
               
               <h1 className="text-4xl md:text-7xl font-black text-slate-900 tracking-tight leading-tight relative z-20">
                 Welcome to <br/>
                 <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-600 drop-shadow-sm">Gathering Place</span>
               </h1>
               <p className="text-lg md:text-xl text-slate-600 font-medium max-w-2xl mx-auto leading-relaxed relative z-20">
                 Select a program below to mark your attendance.
               </p>
            </div>

            {/* Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-7xl px-4">
              {[
                {
                  id: 'skills',
                  title: 'Skills Acquisition',
                  day: 'Tuesday',
                  sub: 'Weekly Class',
                  img: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=800&auto=format&fit=crop&q=60',
                  desc: 'Vocational training and self-reliance skills.'
                },
                {
                  id: 'cluster',
                  title: 'Institute Cluster',
                  day: 'Thursday',
                  sub: 'Odeda & Obantoko',
                  img: 'https://images.unsplash.com/photo-1529070538774-1843cb3265df?w=800&auto=format&fit=crop&q=60',
                  desc: 'Cluster gatherings for Odeda and Obantoko.'
                },
                {
                  id: 'institute',
                  title: 'Institute of Religion',
                  day: 'Friday',
                  sub: 'Weekly Class',
                  img: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=800&auto=format&fit=crop&q=60',
                  desc: 'Standard Institute of Religion classes.'
                },
                {
                  id: 'missionary',
                  title: 'Missionary Prep',
                  day: 'Saturday',
                  sub: 'Weekly Class',
                  img: 'https://images.unsplash.com/photo-1491841550275-ad7854e35ca6?w=800&auto=format&fit=crop&q=60',
                  desc: 'Preparing prospective missionaries for service.'
                }
              ].map((program, idx) => (
                <button
                  key={program.id}
                  onClick={() => setSelectedProgram(program.id)}
                  className={`group relative flex flex-col overflow-hidden rounded-[2.5rem] bg-white shadow-xl shadow-slate-200/60 hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-500 hover:-translate-y-2 text-left animate-in fade-in slide-in-from-bottom-8 ring-1 ring-slate-100`}
                  style={{ animationDelay: `${idx * 150}ms` }}
                >
                  <div className="h-56 w-full overflow-hidden relative">
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent z-10"/>
                    <img 
                      src={program.img} 
                      alt={program.title}
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute bottom-4 left-4 z-20">
                      <span className="px-4 py-1.5 rounded-full bg-white/95 backdrop-blur text-slate-900 text-[10px] font-black uppercase tracking-widest shadow-lg">
                        {program.day}
                      </span>
                    </div>
                  </div>
                  <div className="p-8 flex-1 flex flex-col bg-white relative z-20">
                    <h3 className="text-2xl font-black text-slate-900 mb-2 group-hover:text-indigo-600 transition-colors tracking-tight">
                      {program.title}
                    </h3>
                    <p className="text-xs font-bold text-indigo-500 uppercase tracking-widest mb-4">
                      {program.sub}
                    </p>
                    <p className="text-slate-500 text-sm leading-relaxed font-medium">
                      {program.desc}
                    </p>
                  </div>
                </button>
              ))}
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
