import React, { useState } from 'react';
import logo from '../image.png';

// In a real application, this should not be hardcoded in the frontend.
// This is a simplified implementation for demonstration.
const USER_PASSCODE = "GATHER24";

interface WelcomePasscodeProps {
  onSuccess: () => void;
}

const WelcomePasscode: React.FC<WelcomePasscodeProps> = ({ onSuccess }) => {
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState('');
  const [isChecking, setIsChecking] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsChecking(true);

    // Simulate a check. In a real app, this might be an API call.
    setTimeout(() => {
      if (passcode.toUpperCase() === USER_PASSCODE) {
        onSuccess();
      } else {
        setError('Incorrect passcode. Please try again.');
        setPasscode('');
      }
      setIsChecking(false);
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md">
      <div className="bg-white rounded-[2.5rem] p-8 max-w-sm w-full shadow-2xl border-4 border-white/20 animate-in fade-in zoom-in-95 duration-500 relative overflow-hidden">
        
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 blur-[80px] rounded-full" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/10 blur-[80px] rounded-full" />

        <div className="relative z-10">
          <header className="text-center mb-8">
            <img src={logo} alt="Gathering Place" className="w-12 h-12 mx-auto mb-4 rounded-2xl shadow-lg shadow-indigo-500/20" />
            <h1 className="text-3xl font-black text-slate-900 mb-1 tracking-tight">Welcome</h1>
            <p className="text-slate-500 font-medium">
              Enter the passcode to continue.
            </p>
          </header>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="passcode" className="sr-only">
                Passcode
              </label>
              <input
                id="passcode"
                type="password"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                className="w-full bg-slate-50 border-0 ring-1 ring-slate-200 rounded-2xl px-4 py-4 focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all font-bold text-slate-800 placeholder:text-slate-400 text-center text-2xl tracking-[0.3em]"
                placeholder="••••••"
                autoFocus
              />
            </div>

            {error && (
              <p className="text-xs font-bold text-red-600 text-center pt-2">{error}</p>
            )}

            <button
              type="submit"
              disabled={isChecking || !passcode}
              className={`w-full py-4 rounded-2xl font-black text-xs text-white uppercase tracking-widest transition-all transform shadow-lg shadow-indigo-500/20 relative group active:scale-[0.98] overflow-hidden mt-4 ${(isChecking || !passcode) ? 'bg-slate-300 text-slate-500 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'}`}
            >
              {isChecking ? 'Checking...' : 'Enter'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default WelcomePasscode;