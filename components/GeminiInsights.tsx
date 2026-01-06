
import React, { useState, useEffect } from 'react';
import { getAttendanceInsights } from '../services/geminiService';
import { AttendanceRecord } from '../types';

interface GeminiInsightsProps {
  records: AttendanceRecord[];
}

const GeminiInsights: React.FC<GeminiInsightsProps> = ({ records }) => {
  const [insights, setInsights] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const fetchInsights = async () => {
    if (records.length === 0) return;
    setIsLoading(true);
    const result = await getAttendanceInsights(records);
    setInsights(result || "No insights available.");
    setIsLoading(false);
  };

  return (
    <div className="bg-slate-900 rounded-[2.5rem] p-8 shadow-2xl shadow-indigo-500/20 h-full flex flex-col relative overflow-hidden">
      {/* Decorative background glow */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-[60px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/10 blur-[80px] rounded-full pointer-events-none" />

      <div className="flex items-center justify-between mb-8 relative z-10">
        <h3 className="text-lg font-black flex items-center gap-3 text-white tracking-tight">
          <div className="bg-indigo-500 p-2 rounded-xl">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
             </svg>
          </div>
          Gemini Intelligence
        </h3>
        {!insights && !isLoading && (
          <button 
            onClick={fetchInsights}
            className="text-[10px] uppercase tracking-widest bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl font-black transition-all border border-white/10"
          >
            Run Analysis
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar relative z-10 pr-2">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full space-y-6">
            <div className="relative">
              <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
              <div className="absolute inset-0 bg-indigo-500/10 blur-xl animate-pulse" />
            </div>
            <p className="text-sm text-indigo-200/60 font-black tracking-widest uppercase">Analyzing trends...</p>
          </div>
        ) : insights ? (
          <div className="space-y-4">
            <div className="prose prose-sm prose-invert max-w-none text-slate-300 leading-relaxed font-medium whitespace-pre-wrap">
              {insights}
            </div>
            <div className="p-4 bg-white/5 rounded-2xl border border-white/5 mt-6">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Recommendation Summary</p>
              <p className="text-xs text-indigo-300 font-semibold italic">"Focus on ward participation consistency for the next quarter."</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-6 py-8">
             <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center border border-white/5">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.364-6.364l-.707-.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M12 21V4" />
                </svg>
             </div>
             <div>
               <p className="text-slate-400 font-bold mb-1">No Analysis Yet</p>
               <p className="text-sm text-slate-500 font-medium px-4">Tap analyze to get deep behavioral insights from your records.</p>
             </div>
          </div>
        )}
      </div>
      
      {insights && !isLoading && (
        <button 
          onClick={fetchInsights}
          className="mt-8 text-[10px] uppercase tracking-widest text-slate-500 hover:text-white transition-colors w-full font-black py-4 border-t border-white/5"
        >
          Regenerate Insights
        </button>
      )}
    </div>
  );
};

export default GeminiInsights;
