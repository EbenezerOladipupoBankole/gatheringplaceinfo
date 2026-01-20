
import React, { useEffect, useState } from 'react';
import { ViewMode } from '../types';
import churchLogo from '../churchlogo.png';
import WelcomePasscode from './WelcomePasscode';

interface LayoutProps {
  children: React.ReactNode;
  currentView: ViewMode;
  onNavigate: (view: ViewMode) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, currentView, onNavigate }) => {
  const isAdminView = currentView === ViewMode.ADMIN_DASHBOARD;
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [isUserAuthorized, setIsUserAuthorized] = useState(false);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = () => {
    if (installPrompt) {
      installPrompt.prompt();
      installPrompt.userChoice.then((choiceResult: any) => {
        if (choiceResult.outcome === 'accepted') {
          setInstallPrompt(null);
        }
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col selection:bg-indigo-100 selection:text-indigo-900 overflow-x-hidden bg-slate-50">
      {currentView === ViewMode.USER_FORM && !isUserAuthorized && (
        <WelcomePasscode onSuccess={() => setIsUserAuthorized(true)} />
      )}

      {/* Navigation */}
      <nav className="sticky top-0 z-50 transition-all duration-500 border-b bg-white/80 border-slate-200 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            <div 
              className="flex items-center gap-4 cursor-pointer group" 
              onClick={() => onNavigate(ViewMode.USER_FORM)}
            >
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg shadow-slate-200 group-hover:scale-105 transition-transform duration-300 bg-white p-1 border border-slate-100">
                <img src={churchLogo} alt="Church Logo" className="w-full h-full object-contain" />
              </div>
              <div className="hidden sm:block">
                <span className="font-black text-base md:text-lg tracking-tight block leading-normal transition-colors overflow-visible pr-1 text-slate-900">
                  Gathering Place
                </span>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] block leading-none mt-2 transition-colors text-slate-400">
                  Attendance Portal
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 p-1.5 rounded-2xl border backdrop-blur-md transition-colors bg-slate-100/60 border-slate-200">
              {installPrompt && (
                <button
                  onClick={handleInstallClick}
                  className="hidden md:block px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-amber-600 hover:bg-amber-50 transition-colors"
                >
                  Install App
                </button>
              )}
              <button 
                onClick={() => onNavigate(ViewMode.USER_FORM)}
                className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all duration-300 ${
                  currentView === ViewMode.USER_FORM 
                  ? 'bg-white text-indigo-900 shadow-sm border border-slate-200' 
                  : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                CHECK IN
              </button>
              <button 
                onClick={() => onNavigate(ViewMode.ADMIN_LOGIN)}
                className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all duration-300 ${
                  currentView !== ViewMode.USER_FORM 
                  ? 'bg-indigo-900 text-white shadow-xl' 
                  : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                ADMIN
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
        <div className="animate-in fade-in duration-1000 slide-in-from-bottom-6">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="py-20 border-t transition-colors bg-white border-slate-200">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-10">
            <div className="text-center md:text-left">
              <div className="flex items-center gap-3 mb-6 justify-center md:justify-start opacity-100">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-white p-0.5 border border-slate-100 shadow-sm">
                  <img src={churchLogo} alt="Church Logo" className="w-full h-full object-contain" />
                </div>
                <span className="font-black tracking-tight text-sm leading-normal overflow-visible pr-1 text-slate-900">Gathering Place</span>
              </div>
              <p className="text-sm max-w-sm font-medium leading-relaxed text-slate-400">
                Facilitating connection and community through faith and modern technology.
              </p>
            </div>
              <div className="flex flex-col items-center md:items-end gap-6">
              <div className="flex gap-10 text-[11px] font-black uppercase tracking-widest text-slate-400">
                <a href="#" className="hover:text-indigo-600 transition-colors">Privacy</a>
                <a href="#" className="hover:text-indigo-600 transition-colors">Safety</a>
                <a href="#" className="hover:text-indigo-600 transition-colors">Support</a>
              </div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-300">
                © {new Date().getFullYear()} Abeokuta Nigeria&nbsp;
                <span className="inline-flex items-center gap-2 align-middle">
                  <span
                    aria-hidden="true"
                    style={{ display: 'inline-block', width: 20, height: 14, borderRadius: 2, overflow: 'hidden', verticalAlign: 'middle' }}
                  >
                    <span style={{ display: 'inline-block', width: 6.5, height: 14, background: '#008751', float: 'left' }} />
                    <span style={{ display: 'inline-block', width: 6.5, height: 14, background: '#ffffff', float: 'left' }} />
                    <span style={{ display: 'inline-block', width: 6.5, height: 14, background: '#008751', float: 'left' }} />
                  </span>
                  <span className="uppercase tracking-widest">Stake</span>
                </span>
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;