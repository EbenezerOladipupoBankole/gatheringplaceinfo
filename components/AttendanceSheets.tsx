import React, { useState, useMemo } from 'react';
import { AttendanceRecord } from '../types';

interface AttendanceSheetsProps {
  records: AttendanceRecord[];
  wards: string[];
  eventType: string;
}

const normalizeWard = (ward: string) => {
  const mapping: Record<string, string> = {
    'Abiola Way': 'Abiola Way Ward',
    'Apena': 'Apena Branch',
    'Alabata': 'Alabata Branch',
    'Kugba': 'Kugba Branch',
    'Obantoko': 'Obantoko Ward',
    'Odeda': 'Odeda Ward'
  };
  return mapping[ward] || ward;
};

const AttendanceSheets: React.FC<AttendanceSheetsProps> = ({ records, wards, eventType }) => {
  const [viewMode, setViewMode] = useState<'matrix' | 'transport'>('matrix');
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [minVisits, setMinVisits] = useState(1);
  const [forceStandard16, setForceStandard16] = useState(false);
  const [instructorName, setInstructorName] = useState('');

  const { uniqueDates, wardRows, columnTotals, grandTotal } = useMemo(() => {
    const [year, month] = selectedMonth.split('-').map(Number);

    const monthlyRecords = records.filter(r => {
      const rDate = new Date(r.date);
      const rType = r.eventType || 'Friday Gathering';
      return rType === eventType &&
        rDate.getFullYear() === year &&
        rDate.getMonth() + 1 === month;
    }).map(r => ({ ...r, ward: normalizeWard(r.ward) }));

    const dates = Array.from(new Set(monthlyRecords.map(r => r.date))).sort();

    const rows = wards.map(ward => {
      const wardRecords = monthlyRecords.filter(r => r.ward === ward);
      const counts: Record<string, number> = {};
      let rowTotal = 0;

      dates.forEach(date => {
        const count = wardRecords.filter(r => r.date === date).length;
        counts[date] = count;
        rowTotal += count;
      });

      return { ward, counts, total: rowTotal };
    }).sort((a, b) => b.total - a.total);

    const colTotals: Record<string, number> = {};
    let allTotal = 0;
    dates.forEach(date => {
      const sum = rows.reduce((acc, row) => acc + (row.counts[date] || 0), 0);
      colTotals[date] = sum;
      allTotal += sum;
    });

    return { uniqueDates: dates, wardRows: rows, columnTotals: colTotals, grandTotal: allTotal };
  }, [records, wards, eventType, selectedMonth]);

  const transportReport = useMemo(() => {
    const [year, month] = selectedMonth.split('-').map(Number);

    // 1. Get all records for the month, across ALL event types
    const monthlyRecords = records.filter(r => {
      const rDate = new Date(r.date);
      return rDate.getFullYear() === year &&
        rDate.getMonth() + 1 === month;
    });

    const dates = Array.from(new Set(monthlyRecords.map(r => r.date))).sort();

    // 3. Structure the data for rendering
    // Helper: Calculate Levenshtein distance for fuzzy matching
    const getLevenshteinDistance = (a: string, b: string): number => {
      if (a.length === 0) return b.length;
      if (b.length === 0) return a.length;
      const matrix = Array.from(Array(b.length + 1), () => Array(a.length + 1).fill(0));
      for (let i = 0; i <= b.length; i++) { matrix[i][0] = i; }
      for (let j = 0; j <= a.length; j++) { matrix[0][j] = j; }
      for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
          const cost = b.charAt(i - 1) === a.charAt(j - 1) ? 0 : 1;
          matrix[i][j] = Math.min(
            matrix[i - 1][j] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j - 1] + cost
          );
        }
      }
      return matrix[b.length][a.length];
    };

    // Helper: Check if two names are likely the same person (handles typos, substrings, reordering)
    const areNamesSimilar = (n1: string, n2: string) => {
      const clean = (n: string) => n.toLowerCase().trim().replace(/[^a-z\s]/g, '').split(/\s+/).filter(p => p.length > 1);
      const parts1 = clean(n1);
      const parts2 = clean(n2);

      if (parts1.length === 0 || parts2.length === 0) return false;

      // Identify shorter and longer arrays (by number of tokens)
      const [shorter, longer] = parts1.length <= parts2.length ? [parts1, parts2] : [parts2, parts1];

      let matches = 0;
      const usedIndices = new Set<number>();

      for (const sPart of shorter) {
        for (let i = 0; i < longer.length; i++) {
          if (usedIndices.has(i)) continue;

          const lPart = longer[i];

          // 1. Exact match
          if (sPart === lPart) {
            matches++;
            usedIndices.add(i);
            break;
          }

          // 2. Levenshtein (Typos)
          const dist = getLevenshteinDistance(sPart, lPart);
          // Allow 1 edit for length >= 3, 2 edits for length >= 6
          const allowed = sPart.length >= 6 ? 2 : (sPart.length >= 3 ? 1 : 0);
          if (dist <= allowed) {
            matches++;
            usedIndices.add(i);
            break;
          }

          // 3. Substring (e.g. Jide in Olajide)
          if ((lPart.includes(sPart) && lPart.length > sPart.length) ||
            (sPart.includes(lPart) && sPart.length > lPart.length)) {
            matches++;
            usedIndices.add(i);
            break;
          }
        }
      }

      // Require matching all parts of the shorter name representation
      return matches >= shorter.length;
    };

    // Global tracking to merge people across wards
    interface PersonData {
      name: string;
      visitCount: number;
      groups: Record<string, number>;
      wardCounts: Record<string, number>;
      uniqueVisitKeys: Set<string>;
    }
    const globalPersons: PersonData[] = [];

    monthlyRecords.forEach(r => {
      let nameToUse = r.full_name;

      // Explicit Alias Merging
      if (normalizeWard(r.ward).includes('Apena')) {
        const lower = nameToUse.toLowerCase();
        // Merge "Bamidele Sunday" and "Bamide David"
        if (lower.includes('bamide') && (lower.includes('david') || lower.includes('sunday'))) {
          nameToUse = 'Bamidele Sunday';
        }
      }

      // Use the new similarity check
      let person = globalPersons.find(p => areNamesSimilar(p.name, nameToUse));

      if (!person) {
        // Clean name (remove numbers/symbols) and Title Case
        const cleanName = nameToUse.replace(/[^a-zA-Z\s]/g, '').trim();
        const titleCaseName = cleanName.toLowerCase().split(/\s+/)
          .map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

        person = { name: titleCaseName || nameToUse, visitCount: 0, groups: {}, wardCounts: {}, uniqueVisitKeys: new Set() };
        globalPersons.push(person);
      } else {
        // If the new name is more complete, update the stored name to the title-cased version of the new one.
        const cleanR = nameToUse.replace(/[^a-zA-Z\s]/g, '').trim();
        const cleanP = person.name.replace(/[^a-zA-Z\s]/g, '').trim();
        if (cleanR.length > cleanP.length) {
          person.name = cleanR.toLowerCase().split(/\s+/)
            .map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        }
      }

      // Track Ward Usage
      const w = normalizeWard(r.ward);
      person.wardCounts[w] = (person.wardCounts[w] || 0) + 1;

      // Create a unique key for this visit (Date only for transport - 1 trip per day)
      const visitKey = r.date;

      if (!person.uniqueVisitKeys.has(visitKey)) {
        person.visitCount += 1;
        person.uniqueVisitKeys.add(visitKey);
      }

      // Track Class/Group for ALL records so we see everything they attended
      let group = r.eventType || 'Friday Gathering';
      if (group === 'Skills Acquisition' && r.skillCategory) {
        group = r.skillCategory;
      } else if (group === 'Institute Cluster') {
        group = 'Institute Cluster';
      } else if (group === 'Missionary Preparatory Class') {
        group = 'Mission Prep';
      } else if (group === 'Friday Gathering') {
        group = 'Institute';
      }
      person.groups[group] = (person.groups[group] || 0) + 1;
    });

    // Distribute persons to their primary ward (most frequent)
    const data: Record<string, PersonData[]> = {};
    globalPersons.forEach(p => {
      const primaryWard = Object.entries(p.wardCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Unknown';

      if (!data[primaryWard]) data[primaryWard] = [];
      data[primaryWard].push(p);
    });

    // Filter by minVisits, sort by name, and cap visits at 16 (Standard Month limit)
    // Filter by minVisits, sort by name, and standardize to 16
    Object.keys(data).forEach(key => {
      // 1. Remove "Interested Person" category entirely
      if (key === 'Interested Person') {
        delete data[key];
        return;
      }

      data[key] = data[key].filter(p => {
        // 2. Specific filtering requests
        if (key.includes('Alabata') && p.name.includes('Samuel Dada')) return false;
        if (key.includes('Apena') && (p.name.includes('Soremi Victoria') || p.name.includes('Samuel James'))) return false;

        return p.visitCount >= minVisits;
      })
        .sort((a, b) => a.name.localeCompare(b.name))
        .map(p => ({
          ...p,
          // Standardize visit count to 16 if forced, otherwise use actuals
          visitCount: forceStandard16 ? 16 : p.visitCount
        }));

      // Remove empty keys
      if (data[key].length === 0) {
        delete data[key];
      }
    });

    // Determine keys to iterate over
    let reportKeys = Object.keys(data);
    // Sort alphabetically
    reportKeys.sort((a, b) => a.localeCompare(b));

    return { dates, data, reportKeys };
  }, [records, selectedMonth, minVisits, wards, forceStandard16]);

  const startingIndices = useMemo(() => {
    const indices: Record<string, number> = {};
    let currentTotal = 0;
    transportReport.reportKeys.forEach(key => {
      indices[key] = currentTotal;
      currentTotal += (transportReport.data[key]?.length || 0);
    });
    return indices;
  }, [transportReport]);

  const downloadCSV = () => {
    if (uniqueDates.length === 0) return;
    const header = ['S/N', 'Unit', ...uniqueDates, 'Total'].join(',');
    const rows = wardRows.map((row, index) => {
      const counts = uniqueDates.map(date => row.counts[date] || 0).join(',');
      return `${index + 1},"${row.ward}",${counts},${row.total}`;
    });
    const footer = `,TOTAL,${uniqueDates.map(d => columnTotals[d]).join(',')},${grandTotal}`;
    const csvContent = [header, ...rows, footer].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${eventType.replace(/\s+/g, '_')}_${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadWord = () => {
    if (uniqueDates.length === 0) return;

    const tableHTML = `
      <h2 style="text-align: center; font-family: Arial, sans-serif;">${eventType} - ${new Date(parseInt(selectedMonth.split('-')[0]), parseInt(selectedMonth.split('-')[1]) - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</h2>
      <table border="1" style="border-collapse: collapse; width: 100%; font-family: Arial, sans-serif; font-size: 12px;">
        <thead>
          <tr style="background-color: #f0f0f0;">
            <th style="padding: 5px; text-align: left;">Unit</th>
            ${uniqueDates.map(date => `<th style="padding: 5px; text-align: center;">${formatDate(date, { day: 'numeric', month: 'short' })}</th>`).join('')}
            <th style="padding: 5px; text-align: center;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${wardRows.map(row => `
            <tr>
              <td style="padding: 5px;">${row.ward}</td>
              ${uniqueDates.map(date => `<td style="padding: 5px; text-align: center;">${row.counts[date] > 0 ? row.counts[date] : '-'}</td>`).join('')}
              <td style="padding: 5px; text-align: center; font-weight: bold;">${row.total}</td>
            </tr>
          `).join('')}
          <tr style="background-color: #333; color: white;">
            <td style="padding: 5px; font-weight: bold;">Grand Total</td>
            ${uniqueDates.map(date => `<td style="padding: 5px; text-align: center;">${columnTotals[date]}</td>`).join('')}
            <td style="padding: 5px; text-align: center; font-weight: bold;">${grandTotal}</td>
          </tr>
        </tbody>
      </table>
    `;

    const header = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>Attendance Matrix</title></head><body>`;
    const footer = "</body></html>";
    const sourceHTML = header + tableHTML + footer;

    const blob = new Blob(['\ufeff', sourceHTML], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${eventType.replace(/\s+/g, '_')}_${selectedMonth}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatDate = (dateStr: string, options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', weekday: 'short' }) => {
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString('en-US', options);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <style>{`
          @media print {
            @page { margin: 0.3cm; size: landscape; }
            body { 
              -webkit-print-color-adjust: exact; 
              zoom: 0.85;
            }
            html, body {
              height: auto !important;
              overflow: visible !important;
            }
            body { -webkit-print-color-adjust: exact; }
            body * { visibility: hidden; }
            /* Allow both report containers to be visible when printing */
            #transport-report, #transport-report *, #matrix-report, #matrix-report * { visibility: visible; }
            #transport-report, #matrix-report { 
              position: absolute; 
              left: 0; 
              top: 0; 
              width: 100%; 
              background: white; 
              z-index: 9999;
            }
            /* Ensure all parent containers allow overflow to prevent clipping */
            div { overflow: visible !important; }
            .no-print { display: none !important; }
            .page-break { 
              page-break-after: always; 
              break-after: page;
              display: block;
            }
          }
        `}</style>
      <div className="bg-white/90 backdrop-blur-sm p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900">Attendance Sheets</h3>
          <p className="text-xs text-slate-500">
            {viewMode === 'matrix'
              ? `Generate monthly matrix reports for ${eventType}`
              : 'Generate consolidated transportation assistance reports'}
          </p>
        </div>

        <div className="flex items-center gap-3 bg-slate-50 p-1.5 rounded-xl border border-slate-200">
          <div className="flex bg-white rounded-lg border border-slate-200 p-1">
            <button
              onClick={() => setViewMode('matrix')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${viewMode === 'matrix' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              Matrix
            </button>
            <button
              onClick={() => setViewMode('transport')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${viewMode === 'transport' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              Transport
            </button>
          </div>

          <div className="w-px h-8 bg-slate-200 mx-1" />

          {viewMode === 'transport' && (
            <>
              <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-slate-200">
                <span className="text-[10px] font-bold uppercase text-slate-500">Min Visits</span>
                <input
                  type="number"
                  min="1"
                  value={minVisits}
                  onChange={(e) => setMinVisits(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-10 text-sm font-bold text-slate-900 outline-none bg-transparent text-center"
                />
              </div>
              <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-slate-200">
                <input
                  type="checkbox"
                  id="forceStandard"
                  checked={forceStandard16}
                  onChange={(e) => setForceStandard16(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
                <label htmlFor="forceStandard" className="text-[10px] font-bold uppercase text-slate-500 cursor-pointer select-none">
                  Force 16
                </label>
              </div>

              <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-slate-200">
                <span className="text-[10px] font-bold uppercase text-slate-500">Leader:</span>
                <input
                  type="text"
                  placeholder="Enter Name"
                  value={instructorName}
                  onChange={(e) => setInstructorName(e.target.value)}
                  className="w-32 text-sm font-bold text-slate-900 outline-none bg-transparent"
                />
              </div>
            </>
          )}

          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="bg-white border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block px-3 py-2 outline-none font-bold"
          />

          {viewMode === 'matrix' ? (
            <div className="flex gap-2">
              <button
                onClick={downloadCSV}
                disabled={uniqueDates.length === 0}
                className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-lg text-xs font-bold uppercase tracking-wide transition-colors flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                CSV
              </button>
              <button
                onClick={downloadWord}
                disabled={uniqueDates.length === 0}
                className="px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-lg text-xs font-bold uppercase tracking-wide transition-colors flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" /></svg>
                Word
              </button>
              <button
                onClick={() => window.print()}
                disabled={uniqueDates.length === 0}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-900 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-lg text-xs font-bold uppercase tracking-wide transition-colors flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a2 2 0 002 2h6a2 2 0 002-2v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0v3H7V4h6zm-8 7.414l2.293 2.293a1 1 0 001.414 0L16 6.586V9a1 1 0 011 1v3a1 1 0 01-1 1h-1v-2a2 2 0 00-2-2H7a2 2 0 00-2 2v2H4a1 1 0 01-1-1V9a1 1 0 011-1h2.586z" clipRule="evenodd" /></svg>
                Print / PDF
              </button>
            </div>
          ) : (
            <button
              onClick={() => window.print()}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold uppercase tracking-wide transition-colors flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a2 2 0 002 2h6a2 2 0 002-2v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0v3H7V4h6zm-8 7.414l2.293 2.293a1 1 0 001.414 0L16 6.586V9a1 1 0 011 1v3a1 1 0 01-1 1h-1v-2a2 2 0 00-2-2H7a2 2 0 00-2 2v2H4a1 1 0 01-1-1V9a1 1 0 011-1h2.586z" clipRule="evenodd" /></svg>
              Print Report
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {viewMode === 'matrix' ? (
          uniqueDates.length > 0 ? (
            <div id="matrix-report" className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider sticky left-0 bg-slate-50 z-10 border-r border-slate-200">Unit</th>
                    {uniqueDates.map(date => (
                      <th key={date} className="px-4 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center min-w-[100px]">
                        {formatDate(date)}
                      </th>
                    ))}
                    <th className="px-6 py-4 text-xs font-black text-slate-900 uppercase tracking-wider text-center bg-slate-100/50 border-l border-slate-200">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {wardRows.map((row, idx) => (
                    <tr key={row.ward} className={`hover:bg-indigo-50/30 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}`}>
                      <td className="px-6 py-3 text-sm font-bold text-slate-700 sticky left-0 bg-inherit border-r border-slate-100 z-10">
                        {row.ward}
                      </td>
                      {uniqueDates.map(date => (
                        <td key={date} className="px-4 py-3 text-sm text-slate-600 text-center tabular-nums">
                          {row.counts[date] > 0 ? (
                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 font-bold">
                              {row.counts[date]}
                            </span>
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </td>
                      ))}
                      <td className="px-6 py-3 text-sm font-black text-slate-900 text-center bg-slate-50/50 border-l border-slate-100">
                        {row.total}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-slate-900 text-white">
                    <td className="px-6 py-4 text-xs font-black uppercase tracking-wider sticky left-0 bg-slate-900 z-10 border-r border-slate-800">
                      Grand Total
                    </td>
                    {uniqueDates.map(date => (
                      <td key={date} className="px-4 py-4 text-sm font-bold text-center">
                        {columnTotals[date]}
                      </td>
                    ))}
                    <td className="px-6 py-4 text-sm font-black text-center bg-slate-800 border-l border-slate-700">
                      {grandTotal}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-20 text-center">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-slate-900 font-bold text-lg">No Records Found</h3>
              <p className="text-slate-500 text-sm mt-1">There are no attendance records for {eventType} in the selected month.</p>
            </div>
          )
        ) : (
          <div id="transport-report" className="min-h-[500px] bg-white">
            {transportReport.reportKeys.map((groupKey, index) => {
              const persons = transportReport.data[groupKey]!;
              const startIndex = startingIndices[groupKey];

              return (
                <div key={groupKey} className="mb-0 p-4 page-break bg-white">
                  {/* Header */}
                  <div className="text-center mb-1">
                    <h1 className="text-lg font-black text-black uppercase tracking-tight">Africa West Area Gathering Place Daily Attendance Register</h1>
                    <h2 className="text-base font-bold text-indigo-900 uppercase mt-0">Consolidated Monthly Report</h2>
                  </div>

                  {/* Meta Info Box */}
                  <div className="border border-amber-800 mb-0">
                    <div className="flex border-b border-amber-800">
                      <div className="w-2/3 p-2 border-r border-amber-800">
                        <span className="font-bold text-black text-sm">Unit:</span>
                        <span className="ml-2 font-bold text-black uppercase">{groupKey}</span>
                        <span className="ml-4 font-black text-black text-sm">(Abeokuta Nigeria Stake)</span>
                      </div>
                      <div className="w-1/3 p-2">
                        <span className="font-bold text-black text-sm">Date:</span>
                        <span className="ml-2 text-black text-sm">{new Date(parseInt(selectedMonth.split('-')[0]), parseInt(selectedMonth.split('-')[1]) - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
                      </div>
                    </div>
                    <div className="text-center bg-amber-50 p-1 font-bold text-black text-sm uppercase">
                      Participants List
                    </div>
                  </div>

                  {/* Table */}
                  <table className="w-full border-collapse border border-amber-800 text-[10px]">
                    <thead>
                      <tr className="text-center">
                        <th className="border border-amber-800 p-0.5 w-8 text-amber-900 font-bold">S/N</th>
                        <th className="border border-amber-800 p-0.5 text-amber-900 font-bold">Member Name</th>
                        <th className="border border-amber-800 p-0.5 text-amber-900 font-bold">Ward/Branch</th>
                        <th className="border border-amber-800 p-0.5 text-amber-900 font-bold">Class/Group</th>
                        <th className="border border-amber-800 p-0.5 w-12 text-amber-900 font-bold">Total Visits</th>
                      </tr>
                    </thead>
                    <tbody>
                      {persons.map((person, idx) => {
                        // List all groups attended
                        const allGroups = Object.keys(person.groups).sort().join(', ');

                        return (<tr key={person.name} className="h-5">
                          <td className="border border-amber-800 p-0.5 text-center font-bold text-black">{startIndex + idx + 1}</td>
                          <td className="border border-amber-800 p-0.5 px-2 font-bold text-black">{person.name}</td>
                          <td className="border border-amber-800 p-0.5 px-2 text-black">{groupKey}</td>
                          <td className="border border-amber-800 p-0.5 px-2 text-black">{allGroups}</td>
                          <td className="border border-amber-800 p-0.5 text-center font-bold text-black">{person.visitCount}</td>
                        </tr>
                        );
                      })}
                      {/* Empty rows filler if needed, or just let it shrink */}
                      {Array.from({ length: Math.max(0, 15 - persons.length) }).map((_, i) => (
                        <tr key={`empty-${i}`} className="h-5">
                          <td className="border border-amber-800 p-0.5 text-center text-slate-300"></td>
                          <td className="border border-amber-800 p-0.5"></td>
                          <td className="border border-amber-800 p-0.5"></td>
                          <td className="border border-amber-800 p-0.5"></td>
                          <td className="border border-amber-800 p-0.5"></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div className="mt-4 mb-2 text-sm font-black text-slate-900 uppercase tracking-wide">
                    Expected Visit for the month for each YA is _____
                  </div>

                  {/* Footer */}
                  <div className="flex justify-between items-center mt-4 border-t border-slate-200 pt-4 text-sm font-bold text-black">
                    <div className="flex items-center gap-2">
                      <span>Stake YSA Leaders:</span>
                      <div className="border-b border-black w-48 h-4 flex items-end">
                        <span className="w-full text-center mb-[-4px]">{instructorName}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>E-Signature:</span>
                      <div className="border-b border-black w-32 h-4"></div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>Contact:</span>
                      <div className="border-b border-black w-32 h-4"></div>
                    </div>
                  </div>

                  <div className="mt-8 text-[10px] text-slate-400 text-center flex justify-between">
                    <span>Gathering Place Attendance System</span>
                    <span>Page {index + 1}</span>
                  </div>
                </div>
              );
            })}
            {Object.keys(transportReport.data).length === 0 && (
              <div className="text-center py-20 text-slate-400">No attendance data available for this month.</div>
            )}

            {/* Global Print Styles specific to this template */}
            {/* Styles merged to top */}
          </div>
        )}
      </div>
    </div >
  );
};

export default AttendanceSheets;