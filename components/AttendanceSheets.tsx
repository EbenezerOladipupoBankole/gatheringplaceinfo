import React, { useState, useMemo } from 'react';
import { AttendanceRecord } from '../types';

interface AttendanceSheetsProps {
  records: AttendanceRecord[];
  wards: string[];
  eventType: string;
}

const AttendanceSheets: React.FC<AttendanceSheetsProps> = ({ records, wards, eventType }) => {
  const [viewMode, setViewMode] = useState<'matrix' | 'transport'>('matrix');
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [minVisits, setMinVisits] = useState(1);

  const { uniqueDates, wardRows, columnTotals, grandTotal } = useMemo(() => {
    const [year, month] = selectedMonth.split('-').map(Number);

    const monthlyRecords = records.filter(r => {
      const rDate = new Date(r.date);
      const rType = r.eventType || 'Friday Gathering';
      return rType === eventType &&
        rDate.getFullYear() === year &&
        rDate.getMonth() + 1 === month;
    });

    const recordDates = Array.from(new Set(monthlyRecords.map(r => r.date))).sort();

    const expectedDates = new Set<string>();
    const daysInMonth = new Date(year, month, 0).getDate();

    const targetDays = new Set<number>();
    if (eventType === 'Skills Acquisition') {
      targetDays.add(2); // Tuesday
    } else if (eventType === 'Institute Cluster') {
      targetDays.add(4); // Thursday
    } else if (eventType === 'Missionary Preparatory Class') {
      targetDays.add(6); // Saturday
    } else {
      targetDays.add(5); // Friday (Friday Gathering)
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const dateObj = new Date(year, month - 1, d);
      const dayOfWeek = dateObj.getDay(); // 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
      if (targetDays.has(dayOfWeek)) {
        const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        expectedDates.add(dateStr);
      }
    }

    const dates = Array.from(new Set([...recordDates, ...expectedDates])).sort();

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

    // 1. Get all records for the month, for the three main event types
    const monthlyRecords = records.filter(r => {
      const rDate = new Date(r.date);
      const rType = r.eventType || 'Friday Gathering';
      const relevantTypes = ['Friday Gathering', 'Skills Acquisition', 'Institute Cluster', 'Missionary Preparatory Class'];
      return relevantTypes.includes(rType) &&
        rDate.getFullYear() === year &&
        rDate.getMonth() + 1 === month;
    });

    // 2. Get all possible dates (Tuesdays, Thursdays, Fridays) for the month
    const allDates = new Set<string>();
    const daysInMonth = new Date(year, month, 0).getDate();
    for (let d = 1; d <= daysInMonth; d++) {
      const dateObj = new Date(year, month - 1, d);
      const dayOfWeek = dateObj.getDay(); // 2=Tue, 4=Thu, 5=Fri, 6=Sat
      if ([2, 4, 5, 6].includes(dayOfWeek)) {
        const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        allDates.add(dateStr);
      }
    }
    const dates = Array.from(allDates).sort();

    // 3. Structure the data for rendering
    const data: Record<string, { name: string; dates: Set<string>; groups: Record<string, number>; ward: string }[]> = {};

    monthlyRecords.forEach(r => {
      // Determine Grouping Key
      let key = r.ward; // Default to Ward

      if (!data[key]) data[key] = [];

      // Normalize for comparison (case-insensitive, trim whitespace)
      const normalizedInputName = r.full_name.trim().toLowerCase();
      let person = data[key].find(p => p.name.trim().toLowerCase() === normalizedInputName);

      if (!person) {
        person = { name: r.full_name.trim(), dates: new Set(), groups: {}, ward: r.ward };
        data[key].push(person);
      }
      person.dates.add(r.date);

      // Track Class/Group
      let group = r.eventType || 'Friday Gathering';
      if (group === 'Skills Acquisition' && r.skillCategory) {
        group = r.skillCategory;
      } else if (group === 'Friday Gathering') {
        group = 'Institute';
      }
      person.groups[group] = (person.groups[group] || 0) + 1;
    });

    // Filter by minVisits and sort by name
    Object.keys(data).forEach(key => {
      data[key] = data[key].filter(p => p.dates.size >= minVisits)
        .sort((a, b) => a.name.localeCompare(b.name));

      // Remove empty keys
      if (data[key].length === 0) {
        delete data[key];
      }
    });

    // Determine keys to iterate over
    let reportKeys: string[] = [];
    // Use wards prop to maintain order, but include any data found
    reportKeys = wards.filter(w => data[w]);
    const extraKeys = Object.keys(data).filter(k => !wards.includes(k));
    reportKeys = [...reportKeys, ...extraKeys];

    return { dates, data, reportKeys };
  }, [records, selectedMonth, minVisits, wards, eventType]);

  const downloadCSV = () => {
    if (uniqueDates.length === 0) return;
    const header = ['Unit', ...uniqueDates, 'Total'].join(',');
    const rows = wardRows.map(row => {
      const counts = uniqueDates.map(date => row.counts[date] || 0).join(',');
      return `"${row.ward}",${counts},${row.total}`;
    });
    const footer = `TOTAL,${uniqueDates.map(d => columnTotals[d]).join(',')},${grandTotal}`;
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

  const formatDate = (dateStr: string, options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', weekday: 'short' }) => {
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString('en-US', options);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {viewMode === 'transport' && (
        <style>{`
          @media print {
            @page { margin: 0.5cm; size: landscape; }
            html, body {
              height: auto !important;
              overflow: visible !important;
            }
            body { -webkit-print-color-adjust: exact; }
            body * { visibility: hidden; }
            #transport-report, #transport-report * { visibility: visible; }
            #transport-report { 
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
      )}
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
            </>
          )}

          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="bg-white border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block px-3 py-2 outline-none font-bold"
          />

          {viewMode === 'matrix' ? (
            <button
              onClick={downloadCSV}
              disabled={uniqueDates.length === 0}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-lg text-xs font-bold uppercase tracking-wide transition-colors flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              Download CSV
            </button>
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
            <div className="overflow-x-auto">
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
              
              const eventTitle = {
                'Skills Acquisition': 'Tuesday Skill Classes',
                'Institute Cluster': 'Thursday Cluster Institute',
                'Friday Gathering': 'Friday Gathering/Institute',
                'Missionary Preparatory Class': 'Saturday Mission Prep Class'
              }[eventType] || eventType;

              return (
                <div key={groupKey} className="mb-8 p-8 page-break bg-white">
                  {/* Header */}
                  <div className="text-center mb-4">
                    <h1 className="text-2xl font-black text-black uppercase tracking-tight">Africa West Area Gathering Place Daily Attendance Register</h1>
                    <h2 className="text-xl font-bold text-indigo-900 uppercase mt-2">{eventTitle}</h2>
                  </div>

                  {/* Meta Info Box */}
                  <div className="border border-amber-800 mb-0">
                    <div className="flex border-b border-amber-800">
                      <div className="w-2/3 p-2 border-r border-amber-800">
                        <span className="font-bold text-black text-sm">Unit:</span>
                        <span className="ml-2 font-bold text-black uppercase">{groupKey}</span>
                        <span className="ml-4 text-xs text-slate-500">(Abeokuta Nigeria Stake)</span>
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
                  <table className="w-full border-collapse border border-amber-800 text-xs">
                    <thead>
                      <tr className="text-center">
                        <th className="border border-amber-800 p-1 w-10 text-amber-900 font-bold">S/N</th>
                        <th className="border border-amber-800 p-1 text-amber-900 font-bold">Member Name</th>
                        <th className="border border-amber-800 p-1 text-amber-900 font-bold">Ward/Branch</th>
                        <th className="border border-amber-800 p-1 text-amber-900 font-bold">Class/Group</th>
                        <th className="border border-amber-800 p-1 w-16 text-amber-900 font-bold">Total Visits</th>
                      </tr>
                    </thead>
                    <tbody>
                      {persons.map((person, idx) => {
                        // Determine main group
                        const mainGroup = Object.entries(person.groups).sort((a, b) => b[1] - a[1])[0]?.[0] || '';

                        return (<tr key={person.name} className="h-8">
                          <td className="border border-amber-800 p-1 text-center font-bold text-black">{idx + 1}</td>
                          <td className="border border-amber-800 p-1 px-2 font-bold text-black">{person.name}</td>
                          <td className="border border-amber-800 p-1 px-2 text-black">{person.ward}</td>
                          <td className="border border-amber-800 p-1 px-2 text-black">{mainGroup}</td>
                          <td className="border border-amber-800 p-1 text-center font-bold text-black">{person.dates.size}</td>
                        </tr>
                        );
                      })}
                      {/* Empty rows filler if needed, or just let it shrink */}
                      {Array.from({ length: Math.max(0, 15 - persons.length) }).map((_, i) => (
                        <tr key={`empty-${i}`} className="h-8">
                          <td className="border border-amber-800 p-1 text-center text-slate-300">{persons.length + i + 1}</td>
                          <td className="border border-amber-800 p-1"></td>
                          <td className="border border-amber-800 p-1"></td>
                          <td className="border border-amber-800 p-1"></td>
                          <td className="border border-amber-800 p-1"></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Footer */}
                  <div className="flex justify-between items-center mt-8 border-t border-slate-200 pt-8 text-sm font-bold text-black">
                    <div className="flex items-center gap-2">
                      <span>Instructor Name:</span>
                      <div className="border-b border-black w-48 h-4"></div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>Signature:</span>
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
    </div>
  );
};

export default AttendanceSheets;