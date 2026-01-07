
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
  "bankoleebenezer111@gmail.com",    // <--- Put the 2nd admin's email here
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
                   src="https://images.unsplash.com/photo-1523580494863-6f3031224c94?q=80&w=2000&auto=format&fit=crop" 
                   alt="YSA Gathering" 
                   className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                 />
                 <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent" />
                 <div className="absolute bottom-6 left-8 md:bottom-10 md:left-12">
                    <span className="px-4 py-1.5 rounded-full bg-white/20 backdrop-blur-md border border-white/20 text-white text-[10px] font-black uppercase tracking-widest mb-3 inline-block">
                      Latter-day Saint YSA
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
              
              {/* Main Headline */}
              <h2 className="text-7xl md:text-9xl font-black text-white mb-10 tracking-tighter leading-[0.85] drop-shadow-[0_20px_20px_rgba(0,0,0,0.6)]">
                Welcome to <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-amber-100 italic">Gathering Place</span>
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
                  Sign the Book of Remembrance Below
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
              <img src={logo} alt="Logo" className="w-24 h-auto mx-auto mb-10 drop-shadow-2xl animate-float" />
              <h2 className="text-3xl font-black text-slate-900 mb-2 text-center tracking-tight">Portal Entry</h2>
              <p className="text-slate-500 mb-12 text-center font-semibold">Leadership authorization required.</p>
              
              <div className="space-y-8">
                {authError && <p className="text-red-600 text-xs font-black text-center animate-bounce">{authError}</p>}
                <button 
                  onClick={handleAdminLogin}
                  className="w-full bg-slate-900 hover:bg-black text-white font-black py-5 px-4 rounded-[1.5rem] shadow-2xl transition-all active:scale-[0.98] uppercase tracking-[0.2em] text-sm flex items-center justify-center gap-3"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"/>
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
