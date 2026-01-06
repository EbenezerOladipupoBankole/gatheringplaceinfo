
import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import AttendanceForm from './components/AttendanceForm';
import AdminDashboard from './components/AdminDashboard';
import { ViewMode } from './types';
import { ADMIN_PASSWORD } from './constants';

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

const App: React.FC = () => {
  const [view, setView] = useState<ViewMode>(ViewMode.USER_FORM);
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState('');
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

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === ADMIN_PASSWORD) {
      setView(ViewMode.ADMIN_DASHBOARD);
      setAuthError('');
    } else {
      setAuthError('Incorrect password. Please try again.');
    }
  };

  const renderContent = () => {
    switch (view) {
      case ViewMode.USER_FORM:
        return (
          <div className="py-12 md:py-20 flex flex-col items-center">
            <div className="text-center mb-16 max-w-4xl px-4 animate-in fade-in slide-in-from-top-10 duration-1000">
              {/* Regional Badge */}
              <div className="inline-flex items-center gap-3 px-6 py-2.5 mb-10 rounded-full bg-white/5 border border-white/10 backdrop-blur-2xl shadow-2xl group cursor-default">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse shadow-[0_0_10px_rgba(251,191,36,0.8)]"></span>
                <span className="text-[10px] font-black text-white/90 uppercase tracking-[0.4em] group-hover:tracking-[0.5em] transition-all">Abeokuta Gathering Place</span>
              </div>
              
              {/* Main Headline */}
              <h2 className="text-7xl md:text-9xl font-black text-white mb-10 tracking-tighter leading-[0.85] drop-shadow-[0_20px_20px_rgba(0,0,0,0.6)]">
                Welcome <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-amber-100 italic">Home.</span>
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
              <div className="w-20 h-20 bg-slate-900 rounded-[2rem] flex items-center justify-center text-amber-400 mb-10 mx-auto shadow-2xl animate-float">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h2 className="text-3xl font-black text-slate-900 mb-2 text-center tracking-tight">Portal Entry</h2>
              <p className="text-slate-500 mb-12 text-center font-semibold">Leadership authorization required.</p>
              
              <form onSubmit={handleAdminLogin} className="space-y-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Access Code</label>
                  <input 
                    type="password" 
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-50 border border-slate-200 rounded-[1.5rem] px-8 py-5 focus:ring-8 focus:ring-indigo-500/5 focus:border-indigo-600 outline-none transition-all font-black tracking-[0.5em] text-slate-900 text-center text-lg shadow-inner"
                    required
                  />
                </div>
                {authError && <p className="text-red-600 text-xs font-black text-center animate-bounce">{authError}</p>}
                <button 
                  type="submit"
                  className="w-full bg-slate-900 hover:bg-black text-white font-black py-5 px-4 rounded-[1.5rem] shadow-2xl transition-all active:scale-[0.98] uppercase tracking-[0.2em] text-sm"
                >
                  Verify Access
                </button>
              </form>
            </div>
          </div>
        );

      case ViewMode.ADMIN_DASHBOARD:
        return <AdminDashboard />;
        
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
