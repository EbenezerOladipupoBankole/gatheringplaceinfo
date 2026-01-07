
import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import AttendanceForm from './components/AttendanceForm';
import AdminDashboard from './components/AdminDashboard';
import { ViewMode } from './types';
import { auth } from './services/firebaseConfig';
import { GoogleAuthProvider, signInWithPopup, signOut, User } from 'firebase/auth';
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
  "third.admin@gmail.com"      // <--- Put the 3rd admin's email here
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
          <div className="py-12 md:py-20 flex flex-col items-center">
            <div className="w-full max-w-5xl px-4 mb-12 animate-in fade-in zoom-in duration-1000">
               <div className="relative w-full h-64 md:h-96 rounded-[3rem] overflow-hidden shadow-2xl border border-white/10 group">
                 <img 
                   src="https://images.unsplash.com/photo-1511632765486-a01980e01a18?q=80&w=2000&auto=format&fit=crop" 
                   alt="YSA Gathering" 
                   className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                 />
                 <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent" />
                 <div className="absolute bottom-6 left-8 md:bottom-10 md:left-12">
                    <span className="px-4 py-1.5 rounded-full bg-white/20 backdrop-blur-md border border-white/20 text-white text-[10px] font-black uppercase tracking-widest mb-3 inline-block">
                      Young Adults and Gathering Place
                    </span>
                    <p className="text-white font-bold text-xl md:text-3xl tracking-tight drop-shadow-lg max-w-lg">
                      Strengthening Faith Together
                    </p>
                 </div>
               </div>
            </div>
            <div className="text-center mb-16 max-w-4xl px-4 animate-in fade-in slide-in-from-top-10 duration-1000">
              {/* Regional Badge */}
              <div className="inline-flex items-center gap-3 px-6 py-2.5 mb-10 rounded-full bg-white/5 border border-white/10 backdrop-blur-2xl shadow-2xl group cursor-default">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse shadow-[0_0_10px_rgba(251,191,36,0.8)]"></span>
                <span className="text-[10px] font-black text-white/90 uppercase tracking-[0.4em] group-hover:tracking-[0.5em] transition-all">Abeokuta Nigeria Stake</span>
              </div>
              
              <p className="text-[11px] font-bold text-white/70 mb-10 uppercase tracking-wider">
                The Church Of Jesus Christ Of Latter-day Saints
              </p>
              
              {/* Main Headline */}
              <h2 className="text-4xl md:text-6xl font-black text-white mb-10 tracking-tight leading-[0.95] drop-shadow-[0_20px_20px_rgba(0,0,0,0.6)] overflow-visible md:pr-4">
                Welcome to <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-amber-100 italic inline-block pr-2 overflow-visible">Gathering Place</span>
              </h2>

              {/* Dynamic Quote Carousel */}
              <div className="max-w-2xl mx-auto relative mb-16 min-h-[180px] flex flex-col justify-center">
                 <div className={`transition-all duration-1000 transform ${fadeTrigger ? 'opacity-100 translate-y-0 blur-0' : 'opacity-0 -translate-y-4 blur-xl'}`}>
                    <div className="absolute -top-12 -left-8 text-amber-400/10 text-[12rem] font-serif select-none pointer-events-none">“</div>
                    
                    <div className="relative z-10 space-y-4 px-8">
                       <p className="text-3xl md:text-4xl text-white/95 font-medium leading-tight drop-shadow-2xl italic tracking-tight">
                          {SPIRITUAL_QUOTES[quoteIndex].text}
                       </p>
                       
                       <div className="flex flex-col items-center gap-2 pt-4">
                          <div className="h-px w-12 bg-amber-400/40" />
                          <p className="text-[11px] font-black text-amber-400 uppercase tracking-[0.6em]">
                            {SPIRITUAL_QUOTES[quoteIndex].source}
                          </p>
                          <span className="text-[9px] font-bold text-white/30 uppercase tracking-[0.2em]">
                             {SPIRITUAL_QUOTES[quoteIndex].context}
                          </span>
                       </div>
                    </div>

                    <div className="absolute -bottom-20 -right-8 text-amber-400/10 text-[12rem] font-serif select-none pointer-events-none rotate-180">“</div>
                 </div>
              </div>
              
              <div className="space-y-4 opacity-60 hover:opacity-100 transition-opacity">
                <p className="text-sm text-white font-black uppercase tracking-[0.4em]">
                  Jesus Christ is the Way
                </p>
              </div>
            </div>
            
            <AttendanceForm />
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
