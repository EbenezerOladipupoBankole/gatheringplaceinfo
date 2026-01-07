
import React, { useState, useEffect, useRef } from 'react';
import { attendanceService } from '../services/attendanceService';
import { AttendanceRecord } from '../types';
import logo from '../image.png';

const SCRIPTURES = [
  { text: "Trust in the Lord with all thine heart; and lean not unto thine own understanding.", source: "Proverbs 3:5" },
  { text: "If any of you lack wisdom, let him ask of God, that giveth to all men liberally, and upbraideth not.", source: "James 1:5" },
  { text: "Remember, remember that it is upon the rock of our Redeemer, who is Christ, the Son of God, that ye must build your foundation.", source: "Helaman 5:12" },
  { text: "I will go and do the things which the Lord hath commanded, for I know that the Lord giveth no commandments unto the children of men, save he shall prepare a way for them.", source: "1 Nephi 3:7" },
  { text: "Learn of me, and listen to my words; walk in the meekness of my Spirit, and you shall have peace in me.", source: "D&C 19:23" },
  { text: "Be still, and know that I am God.", source: "Psalm 46:10" }
];

const AttendanceForm: React.FC = () => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [ward, setWard] = useState('');
  const [status, setStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({ type: null, message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [availableWards, setAvailableWards] = useState<string[]>([]);
  const [roster, setRoster] = useState<any[]>([]);
  const [pastRecords, setPastRecords] = useState<AttendanceRecord[]>([]);
  const [dailyScripture, setDailyScripture] = useState<{ text: string; source: string } | null>(null);
  
  // Autocomplete states
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setAvailableWards(attendanceService.getWards());
    setRoster(attendanceService.getRoster());
    attendanceService.getRecords().then(setPastRecords);
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
      const records = pastRecords;
      
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !ward || !phone) {
      setStatus({ type: 'error', message: 'Please complete all fields before submitting.' });
      return;
    }

    setIsSubmitting(true);
    
    // Create a timeout promise to prevent infinite loading
    const timeoutPromise = new Promise<{ success: boolean; message: string }>((_, reject) => 
      setTimeout(() => reject(new Error('Request timed out')), 10000)
    );

    try {
      // Race the saveRecord against the timeout
      const result = await Promise.race([attendanceService.saveRecord(name, phone, ward), timeoutPromise]);
      if (result.success) {
        setStatus({ type: 'success', message: result.message });
        setDailyScripture(SCRIPTURES[Math.floor(Math.random() * SCRIPTURES.length)]);
      } else {
        setStatus({ type: 'error', message: result.message });
        setIsSubmitting(false);
      }
    } catch (error) {
      setStatus({ type: 'error', message: 'An unexpected error occurred. Please try again.' });
      setIsSubmitting(false);
    }
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
    day: 'numeric',
    timeZone: 'Africa/Lagos'
  });

  // Calculate progress
  const completedSteps = [!!ward, !!name, !!phone].filter(Boolean).length;
  const progressPercent = (completedSteps / 3) * 100;

  if (status.type === 'success') {
    return (
      <div className="max-w-md mx-auto animate-in fade-in zoom-in-95 duration-1000">
        <div className="bg-white rounded-[2.5rem] p-10 text-center shadow-2xl border border-white/60 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-amber-300 via-amber-500 to-amber-300" />
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 blur-[80px] rounded-full" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/5 blur-[80px] rounded-full" />

          {/* Temple Background for Success View */}
          <div 
            className="absolute inset-0 opacity-[0.08] pointer-events-none mix-blend-multiply grayscale"
            style={{ 
              backgroundImage: 'url("https://images.unsplash.com/photo-1590616867264-5b45264834b7?q=80&w=2000&auto=format&fit=crop")',
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
          />

          <div className="relative z-10">
            <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            
            <h2 className="text-3xl font-serif text-slate-900 mb-3 tracking-tight">Welcome Home</h2>
            <p className="text-slate-500 font-medium mb-10 leading-relaxed text-sm px-4">
              <span className="text-slate-900 font-bold text-lg block mb-1">{name}</span>
              Your attendance has been recorded.
            </p>

            <div className="bg-slate-50 border border-slate-100 p-6 rounded-2xl mb-8 text-left space-y-3 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-amber-500" />
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ward</span>
                <span className="text-sm font-semibold text-slate-800">{ward}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Time</span>
                <span className="text-sm font-semibold text-slate-800">{new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Lagos' })}</span>
              </div>
            </div>

            {dailyScripture && (
              <div className="mb-10 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300 px-2">
                <p className="text-slate-600 font-serif italic text-lg leading-relaxed mb-3">
                  "{dailyScripture.text}"
                </p>
                <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest">
                  — {dailyScripture.source}
                </p>
              </div>
            )}

            <button 
              onClick={handleReset}
              className="w-full py-4 px-10 bg-slate-900 text-white rounded-xl font-bold uppercase tracking-widest hover:bg-black transition-all shadow-xl active:scale-[0.98] text-xs"
            >
              Check In Another Person
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto relative px-4 w-full">
      <div className="bg-white shadow-2xl rounded-[2.5rem] overflow-hidden border border-white/50 animate-in fade-in slide-in-from-bottom-12 duration-1000">
        <div className="p-8 md:p-12 relative overflow-hidden">
          
          {/* Subtle Form Background Image */}
          <div 
            className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-multiply grayscale"
            style={{ 
              backgroundImage: 'url("https://images.unsplash.com/photo-1590616867264-5b45264834b7?q=80&w=2000&auto=format&fit=crop")',
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
          />

          <header className="text-center mb-12 relative z-10">
            <span className="inline-block py-1 px-3 rounded-full bg-slate-100 text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">
              Attendance Registry
            </span>
            <h1 className="text-4xl font-serif text-slate-900 mb-2 tracking-tight">Welcome</h1>
            <p className="text-slate-400 font-medium text-xs uppercase tracking-widest">{todayStr}</p>
          </header>

          <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
            {/* Step 1: Unit Selection */}
            <div className="space-y-2 group">
              <label htmlFor="ward" className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1 transition-colors group-focus-within:text-amber-600">
                Ward / Branch
              </label>
              <div className="relative">
                <select 
                  id="ward"
                  required
                  value={ward}
                  onChange={(e) => {
                    setWard(e.target.value);
                    setName('');
                    setShowSuggestions(false);
                  }}
                  className="w-full bg-white border-2 border-slate-100 rounded-xl px-4 py-4 focus:ring-0 focus:border-amber-500 outline-none transition-all appearance-none font-bold text-slate-800 cursor-pointer text-sm shadow-sm hover:border-slate-200"
                >
                  <option value="" disabled>Select your unit...</option>
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
            <div className="space-y-2 relative group" ref={suggestionRef}>
              <label htmlFor="fullName" className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1 transition-colors group-focus-within:text-amber-600">
                Full Name
              </label>
              <div className="relative">
                <input 
                  id="fullName"
                  type="text" 
                  required
                  autoComplete="off"
                  placeholder={ward ? "Type your name..." : "Select unit first"}
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className={`w-full bg-white border-2 border-slate-100 rounded-xl px-4 py-4 focus:ring-0 focus:border-amber-500 outline-none transition-all font-bold text-slate-800 placeholder:text-slate-300 text-sm shadow-sm hover:border-slate-200 ${!ward ? 'opacity-50 cursor-not-allowed bg-slate-50' : ''}`}
                  disabled={!ward}
                />
              </div>

              {showSuggestions && (
                <div className="absolute z-30 top-full left-0 right-0 mt-2 bg-white rounded-2xl overflow-hidden shadow-2xl border border-slate-100 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="p-3">
                    <div className="px-4 py-2 text-[10px] font-black text-slate-300 uppercase tracking-widest">Suggestions</div>
                    {suggestions.map((s, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => selectSuggestion(s)}
                        className="w-full text-left px-4 py-3 rounded-xl hover:bg-slate-50 hover:text-amber-600 transition-all flex items-center gap-3 group/btn"
                      >
                        <span className="font-bold text-sm text-slate-600 group-hover/btn:text-slate-900">{s}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Step 3: Phone Number */}
            <div className="space-y-2 group">
              <label htmlFor="phone" className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1 transition-colors group-focus-within:text-amber-600">
                Phone Number
              </label>
              <div className="relative">
                <input 
                  id="phone"
                  type="tel" 
                  required
                  placeholder="080..."
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className={`w-full bg-white border-2 border-slate-100 rounded-xl px-4 py-4 focus:ring-0 focus:border-amber-500 outline-none transition-all font-bold text-slate-800 placeholder:text-slate-300 text-sm shadow-sm hover:border-slate-200 ${!ward ? 'opacity-50 cursor-not-allowed bg-slate-50' : ''}`}
                  disabled={!ward}
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isSubmitting || !ward || !name || !phone}
              className={`w-full py-5 rounded-xl font-black text-xs text-white transition-all transform shadow-xl relative group active:scale-[0.98] overflow-hidden mt-8 ${
                (isSubmitting || !ward || !name || !phone)
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed' 
                : 'bg-slate-900 hover:bg-black'
              }`}
            >
              <div className="relative z-10 flex items-center justify-center gap-4">
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span className="tracking-widest">SAVING...</span>
                  </>
                ) : (
                  <span className="tracking-[0.2em]">CONFIRM ATTENDANCE</span>
                )}
              </div>
            </button>
          </form>

          {status.type === 'error' && (
            <div className="mt-8 p-4 rounded-xl bg-red-50 border border-red-100 text-red-700 flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
               <div className="bg-red-600 text-white p-2 rounded-lg shadow-lg flex-shrink-0">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                   <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                 </svg>
               </div>
               <p className="text-xs font-bold leading-relaxed">{status.message}</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Decorative dots below form */}
      <div className="text-center mt-12 opacity-60">
        <p className="text-[10px] text-white uppercase tracking-[0.3em] font-bold">Latter-day Saint Gathering</p>
      </div>
    </div>
  );
};

export default AttendanceForm;
