
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
        return (
          <div className="min-h-[calc(100vh-80px)] flex items-center justify-center py-8 px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
              
              {/* Left Column: Enterprise Hero Content */}
              <div className="text-center lg:text-left space-y-6 animate-in fade-in slide-in-from-left-10 duration-1000">
                
                {/* Badge */}
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-900/40 border border-indigo-500/30 backdrop-blur-md text-indigo-100 mx-auto lg:mx-0 shadow-lg">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-widest">Abeokuta Nigeria Stake</span>
                </div>

                {/* Main Heading */}
                <div className="space-y-4">
                  <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight leading-tight drop-shadow-2xl">
                    Gathering <br/>
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-amber-200">Place</span>
                  </h1>
                  <p className="text-lg md:text-xl text-slate-300 font-medium max-w-2xl mx-auto lg:mx-0 leading-relaxed drop-shadow-md">
                    Strengthening faith and fostering unity among Young Single Adults through inspired connection and learning.
                  </p>
                </div>

                {/* Quote Card (Enterprise Testimonial Style) */}
                <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-6 relative overflow-hidden group hover:bg-white/10 transition-colors duration-500 shadow-2xl">
                  <div className="absolute top-0 right-0 p-6 opacity-10">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="currentColor" className="text-white transform rotate-12">
                      <path d="M14.017 21L14.017 18C14.017 16.8954 14.9124 16 16.017 16H19.017C19.5693 16 20.017 15.5523 20.017 15V9C20.017 8.44772 19.5693 8 19.017 8H15.017C14.4647 8 14.017 8.44772 14.017 9V11C14.017 11.5523 13.5693 12 13.017 12H12.017V5H22.017V15C22.017 18.3137 19.3307 21 16.017 21H14.017ZM5.0166 21L5.0166 18C5.0166 16.8954 5.91203 16 7.0166 16H10.0166C10.5689 16 11.0166 15.5523 11.0166 15V9C11.0166 8.44772 10.5689 8 10.0166 8H6.0166C5.46432 8 5.0166 8.44772 5.0166 9V11C5.0166 11.5523 4.56889 12 4.0166 12H3.0166V5H13.0166V15C13.0166 18.3137 10.3303 21 7.0166 21H5.0166Z" />
                    </svg>
                  </div>
                  
                  <div className={`transition-all duration-700 ${fadeTrigger ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                    <p className="text-xl text-white font-serif italic leading-relaxed mb-6 relative z-10">
                      "{SPIRITUAL_QUOTES[quoteIndex].text}"
                    </p>
                    <div className="flex items-center gap-4">
                      <div className="h-px w-12 bg-amber-400/50"></div>
                      <div>
                        <p className="text-xs font-black text-amber-400 uppercase tracking-widest">{SPIRITUAL_QUOTES[quoteIndex].source}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">{SPIRITUAL_QUOTES[quoteIndex].context}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Stats / Trust Indicators */}
                <div className="flex items-center justify-center lg:justify-start gap-8 pt-4 opacity-80">
                   <div className="text-left">
                      <p className="text-2xl font-black text-white">100+</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active YSAs</p>
                   </div>
                   <div className="w-px h-8 bg-white/10"></div>
                   <div className="text-left">
                      <p className="text-2xl font-black text-white">6</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Skill Programs</p>
                   </div>
                   <div className="w-px h-8 bg-white/10"></div>
                   <div className="text-left">
                      <p className="text-2xl font-black text-white">Weekly</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Gatherings</p>
                   </div>
                </div>
              </div>

              {/* Right Column: Form */}
              <div className="w-full max-w-md mx-auto lg:ml-auto animate-in fade-in slide-in-from-right-10 duration-1000 delay-200">
                <AttendanceForm />
              </div>
            </div>
          </div>
        );

      case ViewMode.ADMIN_LOGIN:
        return (
          <div className="max-w-md mx-auto py-24 px-4">
            <div className="glass p-12 rounded-[3.5rem] border border-white/40 shadow-2xl shadow-black/40">
              <h2 className="text-3xl font-black text-slate-900 mb-2 text-center tracking-tight">Admin Dashboard</h2>
              <p className="text-slate-500 mb-12 text-center font-semibold">Priesthood leader Only</p>
              
              <div className="space-y-8">
                {authError && <p className="text-red-600 text-xs font-black text-center animate-bounce">{authError}</p>}
                <button 
                  onClick={handleAdminLogin}
                  className="w-full bg-white hover:bg-slate-50 text-slate-900 border border-slate-200 font-black py-5 px-4 rounded-[1.5rem] shadow-xl transition-all active:scale-[0.98] uppercase tracking-[0.2em] text-sm flex items-center justify-center gap-4"
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
