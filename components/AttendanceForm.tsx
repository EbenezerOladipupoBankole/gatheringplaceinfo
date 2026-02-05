
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

const SKILLS = [
  'Barbing',
  'ICT',
  'Catering',
  'Shoe Making',
  'Tailoring',
  'Hairdressing'
];

const DESIGNATIONS = [
  'Elder',
  'Sister'
];

const CLUSTERS = [
  'Obantoko',
  'Odeda',
  'Kuto'
];

interface AttendanceFormProps {
  preselectedEvent?: 'Friday Gathering' | 'Skills Acquisition' | 'Institute Cluster' | 'Missionary Preparatory Class';
}

const AttendanceForm: React.FC<AttendanceFormProps> = ({ preselectedEvent }) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [ward, setWard] = useState('');
  const [status, setStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({ type: null, message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [eventType, setEventType] = useState<'Friday Gathering' | 'Skills Acquisition' | 'Institute Cluster' | 'Missionary Preparatory Class'>(preselectedEvent || 'Friday Gathering');
  const [designation, setDesignation] = useState('');
  const [skillCategory, setSkillCategory] = useState('');
  const [cluster, setCluster] = useState('');
  const [selectedDate, setSelectedDate] = useState(() => {
    // Get local date in YYYY-MM-DD format reliably
    const now = new Date();
    const offset = now.getTimezoneOffset();
    const localDate = new Date(now.getTime() - (offset * 60 * 1000));
    return localDate.toISOString().split('T')[0];
  });
  const [availableWards, setAvailableWards] = useState<string[]>([]);
  const [roster, setRoster] = useState<any[]>([]);
  const [pastRecords, setPastRecords] = useState<AttendanceRecord[]>([]);
  const [dailyScripture, setDailyScripture] = useState<{ text: string; source: string } | null>(null);

  // Autocomplete states
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setAvailableWards(attendanceService.getWards().sort((a, b) => a.localeCompare(b)));
    setRoster(attendanceService.getRoster());
    attendanceService.getRecords().then(setPastRecords);
  }, []);

  useEffect(() => {
    if (preselectedEvent) {
      setEventType(preselectedEvent);
    }
  }, [preselectedEvent]);

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
        .sort((a, b) => a.localeCompare(b))
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

    if (eventType === 'Skills Acquisition' && !skillCategory) {
      setStatus({ type: 'error', message: 'Please select a skill department.' });
      return;
    }
    if (eventType === 'Institute Cluster' && !cluster) {
      setStatus({ type: 'error', message: 'Please select a cluster.' });
      return;
    }
    if (eventType === 'Missionary Preparatory Class' && !designation) {
      setStatus({ type: 'error', message: 'Please select a designation.' });
      return;
    }

    // Check for duplicates before submitting
    const isDuplicate = pastRecords.some(
      record =>
        record.date === selectedDate &&
        (record.eventType || 'Friday Gathering') === eventType &&
        record.full_name.trim().toLowerCase() === name.trim().toLowerCase()
    );

    if (isDuplicate) {
      setStatus({ type: 'error', message: `${name} has already signed in for this event on this date.` });
      return;
    }

    setIsSubmitting(true);

    // Create a timeout promise to prevent infinite loading
    const timeoutPromise = new Promise<{ success: boolean; message: string }>((_, reject) =>
      setTimeout(() => reject(new Error('Request timed out')), 10000)
    );

    try {
      // Race the saveRecord against the timeout
      const subCategory = eventType === 'Skills Acquisition' ? skillCategory : (eventType === 'Institute Cluster' ? cluster : (eventType === 'Missionary Preparatory Class' ? designation : ''));
      // @ts-ignore - Updating signature to include event type and skill
      const result = await Promise.race([attendanceService.saveRecord(name, phone, ward, eventType, subCategory, selectedDate), timeoutPromise]);
      if (result.success) {
        setStatus({ type: 'success', message: result.message });
        setDailyScripture(SCRIPTURES[Math.floor(Math.random() * SCRIPTURES.length)]);
        // Add the new record to pastRecords to prevent immediate duplicates without a full refetch
        const newRecord: AttendanceRecord = {
          id: new Date().toISOString(), // A temporary ID is sufficient
          full_name: name.trim(),
          phone_number: phone,
          ward: ward,
          date: selectedDate,
          timestamp: new Date().getTime(),
          eventType: eventType,
          skillCategory: subCategory,
        };
        setPastRecords(prev => [...prev, newRecord]);
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
    setSkillCategory('');
    setCluster('');
    setDesignation('');
    setIsSubmitting(false);
  };

  const displayDate = new Date(selectedDate).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC'
  });

  // Calculate progress
  const requiredFields = [ward, name, phone];
  if (eventType === 'Skills Acquisition') requiredFields.push(skillCategory);
  if (eventType === 'Missionary Preparatory Class') requiredFields.push(designation);
  if (eventType === 'Institute Cluster') requiredFields.push(cluster);
  const completedSteps = requiredFields.filter(Boolean).length;
  const progressPercent = (completedSteps / requiredFields.length) * 100;

  if (status.type === 'success') {
    return (
      <div className="max-w-md mx-auto animate-in fade-in zoom-in-95 duration-1000">
        <div className="bg-white rounded-[2.5rem] p-8 text-center shadow-2xl shadow-indigo-500/10 border border-white relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-amber-300 via-amber-500 to-amber-300" />
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 blur-[80px] rounded-full" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/10 blur-[80px] rounded-full" />

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
            <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>

            <h2 className="text-2xl font-serif text-slate-900 mb-2 tracking-tight">Welcome, {name}</h2>
            <p className="text-slate-500 font-medium mb-6 leading-relaxed text-xs px-4">
              We are grateful to have you at the gathering place today.
            </p>

            <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl mb-6 text-left space-y-2 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-amber-500" />
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Event</span>
                <span className="text-sm font-semibold text-slate-800">{eventType}</span>
              </div>
              {eventType === 'Skills Acquisition' && skillCategory && (
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Skill</span>
                  <span className="text-sm font-semibold text-slate-800">{skillCategory}</span>
                </div>
              )}
              {eventType === 'Missionary Preparatory Class' && designation && (
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Designation</span>
                  <span className="text-sm font-semibold text-slate-800">{designation}</span>
                </div>
              )}
              {eventType === 'Institute Cluster' && cluster && (
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cluster</span>
                  <span className="text-sm font-semibold text-slate-800">{cluster}</span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ward</span>
                <span className="text-sm font-semibold text-slate-800">{ward}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</span>
                <span className="text-sm font-semibold text-slate-800">{selectedDate}</span>
              </div>
            </div>

            {dailyScripture && (
              <div className="mb-6 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300 px-2">
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
              className="w-full py-4 px-10 bg-slate-900 text-white rounded-2xl font-bold uppercase tracking-widest hover:bg-black transition-all shadow-xl shadow-slate-900/20 active:scale-[0.98] text-xs"
            >
              Next Person
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto relative px-4 w-full">
      <div className="bg-white shadow-2xl shadow-slate-200/50 rounded-[2.5rem] overflow-hidden border border-white animate-in fade-in slide-in-from-bottom-12 duration-1000">
        <div className="p-8 relative overflow-hidden">

          {/* Subtle Form Background Image */}
          <div
            className="absolute inset-0 opacity-[0.02] pointer-events-none mix-blend-multiply"
            style={{
              backgroundImage: 'url("https://images.unsplash.com/photo-1590616867264-5b45264834b7?q=80&w=2000&auto=format&fit=crop")',
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
          />

          <header className="text-center mb-8 relative z-10">
            <img src={logo} alt="Gathering Place" className="w-12 h-12 mx-auto mb-4 rounded-2xl shadow-lg shadow-indigo-500/20" />
            <h1 className="text-3xl font-black text-slate-900 mb-1 tracking-tight">{eventType}</h1>
            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">{displayDate}</p>
          </header>

          <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
            {/* Progress Bar */}
            <div className="w-full bg-slate-100 rounded-full h-1.5 mb-6 overflow-hidden">
              <div
                className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full rounded-full transition-all duration-500 ease-out shadow-[0_0_10px_rgba(99,102,241,0.5)]"
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>

            {/* --- STEP 1: EVENT TYPE --- */}
            {!preselectedEvent && (
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Event Type</label>
                <div className="flex p-1.5 bg-slate-50 rounded-2xl border border-slate-100">
                  <button
                    type="button"
                    onClick={() => setEventType('Friday Gathering')}
                    className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${eventType === 'Friday Gathering'
                        ? 'bg-white text-indigo-900 shadow-md shadow-slate-200 ring-1 ring-black/5'
                        : 'text-slate-400 hover:text-slate-600'
                      }`}
                  >
                    Friday Gathering
                  </button>
                  <button
                    type="button"
                    onClick={() => setEventType('Skills Acquisition')}
                    className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${eventType === 'Skills Acquisition'
                        ? 'bg-white text-indigo-900 shadow-md shadow-slate-200 ring-1 ring-black/5'
                        : 'text-slate-400 hover:text-slate-600'
                      }`}
                  >
                    Skills Acquisition
                  </button>
                </div>
              </div>
            )}

            {/* Skill Selection (Conditional) */}
            {eventType === 'Skills Acquisition' && (
              <div className="space-y-2 group animate-in fade-in slide-in-from-top-2 duration-300">
                <label htmlFor="skill" className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 transition-colors group-focus-within:text-indigo-600">
                  Skill Department
                </label>
                <div className="relative flex items-center">
                  <div className="absolute left-4 text-slate-400 pointer-events-none">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                  </div>
                  <select
                    id="skill"
                    required
                    value={skillCategory}
                    onChange={(e) => setSkillCategory(e.target.value)}
                    className="w-full bg-slate-50 border-0 ring-1 ring-slate-200 rounded-2xl pl-11 pr-4 py-4 focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all appearance-none font-bold text-slate-800 cursor-pointer text-sm shadow-sm hover:bg-slate-100"
                  >
                    <option value="" disabled>Select a skill...</option>
                    {SKILLS.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Cluster Selection (Conditional) */}
            {eventType === 'Institute Cluster' && (
              <div className="space-y-2 group animate-in fade-in slide-in-from-top-2 duration-300">
                <label htmlFor="cluster" className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 transition-colors group-focus-within:text-indigo-600">
                  Cluster Location
                </label>
                <div className="relative flex items-center">
                  <div className="absolute left-4 text-slate-400 pointer-events-none">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <select
                    id="cluster"
                    required
                    value={cluster}
                    onChange={(e) => setCluster(e.target.value)}
                    className="w-full bg-slate-50 border-0 ring-1 ring-slate-200 rounded-2xl pl-11 pr-4 py-4 focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all appearance-none font-bold text-slate-800 cursor-pointer text-sm shadow-sm hover:bg-slate-100"
                  >
                    <option value="" disabled>Select a cluster...</option>
                    {CLUSTERS.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}
            {/* Designation Selection (Conditional) */}
            {eventType === 'Missionary Preparatory Class' && (
              <div className="space-y-1.5 group animate-in fade-in slide-in-from-top-2 duration-300">
                <label htmlFor="designation" className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 transition-colors group-focus-within:text-amber-600">
                  Designation
                </label>
                <div className="relative flex items-center">
                  <div className="absolute left-4 text-slate-400 pointer-events-none">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <select
                    id="designation"
                    required
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                    className="w-full bg-white border-2 border-slate-100 rounded-xl pl-10 pr-4 py-2.5 focus:ring-0 focus:border-amber-500 outline-none transition-all appearance-none font-bold text-slate-800 cursor-pointer text-xs shadow-sm hover:border-slate-200"
                  >
                    <option value="" disabled>Select a designation...</option>
                    {DESIGNATIONS.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* --- DATE SELECTION --- */}
            <div className="space-y-2 group">
              <label htmlFor="date" className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 transition-colors group-focus-within:text-indigo-600">
                Date
              </label>
              <div className="relative flex items-center">
                <div className="absolute left-4 text-slate-400 pointer-events-none">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                  </svg>
                </div>
                <input
                  id="date"
                  type="date"
                  required
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full bg-slate-50 border-0 ring-1 ring-slate-200 rounded-2xl pl-11 pr-4 py-4 focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all font-bold text-slate-800 text-sm shadow-sm hover:bg-slate-100"
                />
              </div>
            </div>

            {/* --- STEP 2: UNIT SELECTION --- */}
            <div className="space-y-2 group">
              <label htmlFor="ward" className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 transition-colors group-focus-within:text-indigo-600">
                Ward / Branch
              </label>
              <div className="relative flex items-center">
                <div className="absolute left-4 text-slate-400 pointer-events-none">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" /></svg>
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
                  className="w-full bg-slate-50 border-0 ring-1 ring-slate-200 rounded-2xl pl-11 pr-4 py-4 focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all appearance-none font-bold text-slate-800 cursor-pointer text-sm shadow-sm hover:bg-slate-100"
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

            {/* --- STEP 3: NAME INPUT --- */}
            <div className="space-y-2 relative group" ref={suggestionRef}>
              <label htmlFor="fullName" className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 transition-colors group-focus-within:text-indigo-600">
                Full Name
              </label>
              <div className="relative flex items-center">
                <div className="absolute left-4 text-slate-400 pointer-events-none">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 2a1 1 0 00-1 1v1a1 1 0 002 0V3a1 1 0 00-1-1zM4 4h3a3 3 0 006 0h3a2 2 0 012 2v9a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2zm12 5a1 1 0 100-2H4a1 1 0 100 2h12z" clipRule="evenodd" /></svg>
                </div>
                <input
                  id="fullName"
                  type="text"
                  required
                  autoComplete="off"
                  placeholder={ward ? "Type your name..." : "Select unit first"}
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className={`w-full bg-slate-50 border-0 ring-1 ring-slate-200 rounded-2xl pl-11 pr-4 py-4 focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all font-bold text-slate-800 placeholder:text-slate-400 text-sm shadow-sm hover:bg-slate-100 ${!ward ? 'opacity-50 cursor-not-allowed' : ''}`}
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

            {/* --- STEP 4: PHONE NUMBER --- */}
            <div className="space-y-2 group">
              <label htmlFor="phone" className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 transition-colors group-focus-within:text-indigo-600">
                Phone Number
              </label>
              <div className="relative flex items-center">
                <div className="absolute left-4 text-slate-400 pointer-events-none">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" /></svg>
                </div>
                <input
                  id="phone"
                  type="tel"
                  required
                  placeholder="080..."
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className={`w-full bg-slate-50 border-0 ring-1 ring-slate-200 rounded-2xl pl-11 pr-4 py-4 focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all font-bold text-slate-800 placeholder:text-slate-400 text-sm shadow-sm hover:bg-slate-100 ${!ward ? 'opacity-50 cursor-not-allowed' : ''}`}
                  disabled={!ward}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !ward || !name || !phone}
              className={`w-full py-4 rounded-2xl font-black text-xs text-white transition-all transform shadow-lg shadow-indigo-500/20 relative group active:scale-[0.98] overflow-hidden mt-8 ${(isSubmitting || !ward || !name || !phone)
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700'
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
                  <>
                    <span className="tracking-[0.2em]">CONFIRM ATTENDANCE</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                  </>
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
      <div className="text-center mt-6 opacity-60">
        <p className="text-[10px] text-slate-400 uppercase tracking-[0.3em] font-bold">
          {eventType === 'Friday Gathering' ? 'Young Single Adult Gathering' : (eventType === 'Skills Acquisition' ? 'YSA Skills Acquisition' : (eventType === 'Institute Cluster' ? 'Institute Cluster' : 'Missionary Preparation'))}
        </p>
      </div>
    </div>
  );
};

export default AttendanceForm;
