
import React, { useState, useEffect, useRef } from 'react';
import { attendanceService } from '../services/attendanceService';

const AttendanceForm: React.FC = () => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [ward, setWard] = useState('');
  const [status, setStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({ type: null, message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [availableWards, setAvailableWards] = useState<string[]>([]);
  const [roster, setRoster] = useState<any[]>([]);
  
  // Autocomplete states
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setAvailableWards(attendanceService.getWards());
    setRoster(attendanceService.getRoster());
  }, []);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionRef.current && !suggestionRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNameChange = (val: string) => {
    setName(val);
    if (val.length >= 1) {
      const records = attendanceService.getRecords();
      
      const rosterFiltered = ward 
        ? roster.filter(m => m.ward === ward).map(m => m.name)
        : roster.map(m => m.name);

      const recordFiltered = ward
        ? records.filter(r => r.ward === ward).map(r => r.full_name)
        : records.map(r => r.full_name);

      const allNames = Array.from(new Set([...rosterFiltered, ...recordFiltered]));
      
      const filtered = allNames
        .filter(n => n.toLowerCase().includes(val.toLowerCase()))
        .slice(0, 5); 
      
      setSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const selectSuggestion = (selectedName: string) => {
    setName(selectedName);
    setShowSuggestions(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !ward || !phone) {
      setStatus({ type: 'error', message: 'Please complete all fields before submitting.' });
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      const result = attendanceService.saveRecord(name, phone, ward);
      if (result.success) {
        setStatus({ type: 'success', message: result.message });
      } else {
        setStatus({ type: 'error', message: result.message });
        setIsSubmitting(false);
      }
    }, 1800); 
  };

  const handleReset = () => {
    setStatus({ type: null, message: '' });
    setName('');
    setPhone('');
    setWard('');
    setIsSubmitting(false);
  };

  const todayStr = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  // Calculate progress
  const completedSteps = [!!ward, !!name, !!phone].filter(Boolean).length;
  const progressPercent = (completedSteps / 3) * 100;

  if (status.type === 'success') {
    return (
      <div className="max-w-md mx-auto animate-in fade-in zoom-in-95 duration-1000">
        <div className="glass rounded-[3.5rem] p-10 text-center shadow-[0_50px_100px_rgba(0,0,0,0.5)] border border-white/60 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 blur-[100px] rounded-full" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/10 blur-[100px] rounded-full" />

          <div className="relative z-10">
            <div className="w-24 h-24 bg-gradient-to-tr from-amber-400 via-amber-500 to-amber-600 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-amber-200 rotate-3 animate-float">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            
            <h2 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">Confirmed</h2>
            <p className="text-slate-600 font-semibold mb-8 leading-relaxed text-sm px-4">
              Thank you, <span className="text-indigo-700 underline underline-offset-4 decoration-2">{name}</span>. Your presence is recorded.
            </p>

            <div className="bg-white/40 backdrop-blur-md border border-white/80 p-6 rounded-[2rem] mb-8 text-left shadow-xl space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Unit</span>
                <span className="text-sm font-black text-slate-900">{ward}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Time</span>
                <span className="text-sm font-black text-slate-900">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>

            <button 
              onClick={handleReset}
              className="w-full py-5 px-10 bg-slate-900 text-white rounded-[1.5rem] font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl active:scale-[0.98] text-xs"
            >
              Sign Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto relative px-4 w-full">
      <div className="glass shadow-[0_60px_120px_rgba(0,0,0,0.6)] rounded-[3.5rem] overflow-hidden border border-white/60 p-1 group animate-in fade-in slide-in-from-bottom-12 duration-1000">
        <div className="bg-white/5 rounded-[3.4rem] p-8 md:p-12 backdrop-blur-3xl transition-all relative overflow-hidden">
          
          {/* Subtle Form Background Image */}
          <div 
            className="absolute inset-0 opacity-[0.05] mix-blend-overlay pointer-events-none"
            style={{ 
              backgroundImage: 'url("https://images.unsplash.com/photo-1517524008697-84bbe3c3fd98?q=80&w=2000&auto=format&fit=crop")',
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
          />

          {/* Subtle Progress Bar */}
          <div className="absolute top-0 left-0 w-full h-1.5 bg-white/10">
            <div 
              className="h-full bg-gradient-to-r from-amber-400 to-amber-600 transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(251,191,36,0.6)]" 
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <header className="text-center mb-10 relative z-10">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-indigo-950 to-slate-950 rounded-[1.8rem] mb-8 shadow-2xl animate-float">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h1 className="text-4xl font-black text-slate-950 tracking-tighter mb-2">Registry</h1>
            <p className="text-slate-500 font-black text-[9px] uppercase tracking-[0.4em] opacity-40">{todayStr}</p>
          </header>

          <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
            {/* Step 1: Unit Selection */}
            <div className="space-y-3">
              <label htmlFor="ward" className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4 flex items-center gap-2">
                <span className={`w-1.5 h-1.5 rounded-full transition-all duration-500 ${ward ? 'bg-amber-500 shadow-md' : 'bg-slate-300'}`}></span>
                01. Unit
              </label>
              <div className="relative">
                <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <select 
                  id="ward"
                  required
                  value={ward}
                  onChange={(e) => {
                    setWard(e.target.value);
                    setName('');
                    setShowSuggestions(false);
                  }}
                  className="w-full bg-white/95 border border-slate-200 rounded-[1.5rem] pl-16 pr-10 py-4 focus:ring-8 focus:ring-indigo-500/5 focus:border-indigo-600 outline-none transition-all appearance-none font-black text-slate-900 cursor-pointer shadow-lg text-sm hover:bg-white"
                >
                  <option value="" disabled>Search Unit...</option>
                  {availableWards.map(w => (
                    <option key={w} value={w}>{w}</option>
                  ))}
                </select>
                <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Step 2: Name Input */}
            <div className="space-y-3 relative" ref={suggestionRef}>
              <label htmlFor="fullName" className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4 flex items-center gap-2">
                <span className={`w-1.5 h-1.5 rounded-full transition-all duration-500 ${name ? 'bg-amber-500 shadow-md' : 'bg-slate-300'}`}></span>
                02. Name
              </label>
              <div className="relative">
                <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <input 
                  id="fullName"
                  type="text" 
                  required
                  autoComplete="off"
                  placeholder={ward ? "Your name..." : "Choose unit first"}
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className={`w-full bg-white/95 border border-slate-200 rounded-[1.5rem] pl-16 pr-6 py-4 focus:ring-8 focus:ring-indigo-500/5 focus:border-indigo-600 outline-none transition-all font-black text-slate-900 placeholder:text-slate-300 shadow-lg text-sm hover:bg-white ${!ward ? 'opacity-40 cursor-not-allowed' : ''}`}
                  disabled={!ward}
                />
              </div>

              {showSuggestions && (
                <div className="absolute z-30 top-full left-0 right-0 mt-4 glass rounded-[2rem] overflow-hidden shadow-2xl border border-white/90 animate-in fade-in slide-in-from-top-4 duration-300 backdrop-blur-3xl">
                  <div className="p-3">
                    <div className="px-6 py-2 mb-2 border-b border-slate-100 flex items-center justify-between">
                      <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest">Matches</span>
                    </div>
                    {suggestions.map((s, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => selectSuggestion(s)}
                        className="w-full text-left px-6 py-4 rounded-[1.2rem] hover:bg-slate-950 hover:text-white transition-all flex items-center gap-4 group/btn"
                      >
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-500 group-hover/btn:bg-amber-400 group-hover/btn:text-slate-950 transition-all">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <span className="font-black text-sm tracking-tight">{s}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Step 3: Phone Number */}
            <div className="space-y-3">
              <label htmlFor="phone" className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4 flex items-center gap-2">
                <span className={`w-1.5 h-1.5 rounded-full transition-all duration-500 ${phone ? 'bg-amber-500 shadow-md' : 'bg-slate-300'}`}></span>
                03. Contact
              </label>
              <div className="relative">
                <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
                <input 
                  id="phone"
                  type="tel" 
                  required
                  placeholder="080 ..."
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className={`w-full bg-white/95 border border-slate-200 rounded-[1.5rem] pl-16 pr-6 py-4 focus:ring-8 focus:ring-indigo-500/5 focus:border-indigo-600 outline-none transition-all font-black text-slate-900 placeholder:text-slate-300 shadow-lg text-sm hover:bg-white ${!ward ? 'opacity-40 cursor-not-allowed' : ''}`}
                  disabled={!ward}
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isSubmitting || !ward || !name || !phone}
              className={`w-full py-5 rounded-[1.5rem] font-black text-xs text-white transition-all transform shadow-2xl relative group active:scale-[0.98] overflow-hidden ${
                (isSubmitting || !ward || !name || !phone)
                ? 'bg-slate-300 cursor-not-allowed grayscale' 
                : 'bg-slate-900 hover:bg-black'
              }`}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/0 via-white/10 to-indigo-600/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              <div className="relative z-10 flex items-center justify-center gap-4">
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span className="tracking-widest">PROCESSING</span>
                  </>
                ) : (
                  <span className="tracking-[0.3em]">MARK ATTENDANCE</span>
                )}
              </div>
            </button>
          </form>

          {status.type === 'error' && (
            <div className="mt-8 p-5 rounded-[1.5rem] bg-red-500/10 border border-red-500/20 text-red-700 flex items-center gap-4 animate-in fade-in slide-in-from-top-4 backdrop-blur-3xl shadow-lg">
               <div className="bg-red-600 text-white p-2 rounded-lg shadow-lg flex-shrink-0">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                   <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                 </svg>
               </div>
               <p className="text-[10px] font-black tracking-tight">{status.message}</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Decorative dots below form */}
      <div className="flex justify-center gap-2 mt-8 opacity-20">
        <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
        <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
        <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
      </div>
    </div>
  );
};

export default AttendanceForm;
