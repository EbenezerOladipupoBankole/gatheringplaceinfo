
import React, { useState, useEffect, useMemo } from 'react';
import { User } from 'firebase/auth';
import { attendanceService } from '../services/attendanceService';
import { AttendanceRecord, WardStats, MonthlyStats, QuarterlyStats } from '../types';
import { ADMIN_PASSWORD, RosterMember } from '../constants';
import AttendanceTable from './AttendanceTable';
import AnalyticsCharts from './AnalyticsCharts';
import GeminiInsights from './GeminiInsights';
import AttendanceSheets from './AttendanceSheets';

type AdminTab = 'analytics' | 'records' | 'sheets' | 'settings';

interface AdminDashboardProps {
  user?: User | null;
}

const SKILLS = [
  'Barbing',
  'ICT',
  'Catering',
  'Shoe Making',
  'Tailoring',
  'Hairdressing'
];

const CLUSTERS = [
  'Obantoko',
  'Odeda',
  'Kuto'
];

const AdminDashboard: React.FC<AdminDashboardProps> = ({ user }) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('analytics');
  const [dashboardType, setDashboardType] = useState<'Friday Gathering' | 'Skills Acquisition' | 'Institute Cluster' | 'Missionary Preparatory Class' | 'Devotional' | 'Missionary Departure' | 'Movie Night'>('Friday Gathering');
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [wards, setWards] = useState<string[]>([]);
  const [roster, setRoster] = useState<RosterMember[]>([]);

  const [filterDateStart, setFilterDateStart] = useState(() => {
    // Get local date in YYYY-MM-DD format reliably
    const now = new Date();
    const offset = now.getTimezoneOffset();
    const localDate = new Date(now.getTime() - (offset * 60 * 1000));
    return localDate.toISOString().split('T')[0];
  });
  const [filterDateEnd, setFilterDateEnd] = useState(() => {
    // Get local date in YYYY-MM-DD format reliably
    const now = new Date();
    const offset = now.getTimezoneOffset();
    const localDate = new Date(now.getTime() - (offset * 60 * 1000));
    return localDate.toISOString().split('T')[0];
  });
  const [filterSkill, setFilterSkill] = useState('');
  const [filterCluster, setFilterCluster] = useState('');

  const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(null);
  const [newWardName, setNewWardName] = useState('');
  const [newRosterName, setNewRosterName] = useState('');
  const [newRosterWard, setNewRosterWard] = useState('');
  const [rosterSearch, setRosterSearch] = useState('');

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = async () => {
    const fetchedRecords = await attendanceService.getRecords();
    setRecords(fetchedRecords);
    setWards(attendanceService.getWards());
    setRoster(attendanceService.getRoster());
  };

  const filteredRecords = useMemo(() => {
    const filtered = records.filter(r => {
      const isAfter = filterDateStart ? r.date >= filterDateStart : true;
      const isBefore = filterDateEnd ? r.date <= filterDateEnd : true;
      // Default to 'Friday Gathering' if eventType is missing (backward compatibility)
      const typeMatch = (r.eventType || 'Friday Gathering') === dashboardType;

      const skillMatch = dashboardType === 'Skills Acquisition' && filterSkill
        ? r.skillCategory === filterSkill
        : true;

      const clusterMatch = dashboardType === 'Institute Cluster' && filterCluster
        ? r.skillCategory === filterCluster
        : true;

      return isAfter && isBefore && typeMatch && skillMatch && clusterMatch;
    });

    return filtered.sort((a, b) => (a.full_name || '').localeCompare(b.full_name || ''));
  }, [records, filterDateStart, filterDateEnd, dashboardType, filterSkill, filterCluster]);

  const wardData = useMemo<WardStats[]>(() => {
    const counts: Record<string, number> = {};
    filteredRecords.forEach(r => {
      counts[r.ward] = (counts[r.ward] || 0) + 1;
    });
    return Object.entries(counts).map(([ward, count]) => ({ ward, count }));
  }, [filteredRecords]);

  // Grouped Roster Data for Management
  const groupedRoster = useMemo(() => {
    const groups: Record<string, RosterMember[]> = {};
    // Ensure all active wards have a group, even if empty
    wards.forEach(w => groups[w] = []);

    const filteredMembers = roster.filter(m =>
      m.name.toLowerCase().includes(rosterSearch.toLowerCase())
    );

    filteredMembers.forEach(m => {
      if (!groups[m.ward]) groups[m.ward] = [];
      groups[m.ward].push(m);
    });

    // Sort names within each group
    Object.keys(groups).forEach(key => {
      groups[key].sort((a, b) => a.name.localeCompare(b.name));
    });

    let result = Object.entries(groups).sort((a, b) => a[0].localeCompare(b[0]));

    if (rosterSearch.trim()) {
      result = result.filter(([_, members]) => members.length > 0);
    }

    return result;
  }, [roster, wards, rosterSearch]);

  const dailyData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredRecords.forEach(r => {
      counts[r.date] = (counts[r.date] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, count]) => ({ date, count }));
  }, [filteredRecords]);

  const quarterlyData = useMemo<QuarterlyStats[]>(() => {
    const counts: Record<string, number> = { 'Q1': 0, 'Q2': 0, 'Q3': 0, 'Q4': 0 };
    filteredRecords.forEach(r => {
      const month = parseInt(r.date.split('-')[1]);
      if (month <= 3) counts['Q1']++;
      else if (month <= 6) counts['Q2']++;
      else if (month <= 9) counts['Q3']++;
      else counts['Q4']++;
    });
    return Object.entries(counts).map(([quarter, count]) => ({ quarter, count }));
  }, [filteredRecords]);

  const skillsData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredRecords.forEach(r => {
      if (r.skillCategory) {
        counts[r.skillCategory] = (counts[r.skillCategory] || 0) + 1;
      }
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count }));
  }, [filteredRecords]);

  const topAttendees = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredRecords.forEach(r => {
      counts[r.full_name] = (counts[r.full_name] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));
  }, [filteredRecords]);

  const punctualAttendees = useMemo(() => {
    const times: Record<string, number[]> = {};
    filteredRecords.forEach(r => {
      const date = new Date(r.timestamp);
      // Minutes from midnight
      const minutes = date.getHours() * 60 + date.getMinutes();
      if (!times[r.full_name]) times[r.full_name] = [];
      times[r.full_name].push(minutes);
    });

    return Object.entries(times)
      .map(([name, minutesArr]) => {
        const avg = minutesArr.reduce((a, b) => a + b, 0) / minutesArr.length;
        return { name, avg };
      })
      .sort((a, b) => a.avg - b.avg)
      .slice(0, 5)
      .map(p => {
        const h = Math.floor(p.avg / 60);
        const m = Math.floor(p.avg % 60);
        const ampm = h >= 12 ? 'PM' : 'AM';
        const h12 = h % 12 || 12;
        return {
          name: p.name,
          time: `${h12}:${m.toString().padStart(2, '0')} ${ampm}`
        };
      });
  }, [filteredRecords]);

  const quarterlyChampions = useMemo(() => {
    const quarters: Record<string, Record<string, number>> = {};
    filteredRecords.forEach(r => {
      const month = parseInt(r.date.split('-')[1]);
      let q = 'Q4';
      if (month <= 3) q = 'Q1';
      else if (month <= 6) q = 'Q2';
      else if (month <= 9) q = 'Q3';

      if (!quarters[q]) quarters[q] = {};
      quarters[q][r.full_name] = (quarters[q][r.full_name] || 0) + 1;
    });

    return Object.entries(quarters).map(([quarter, counts]) => {
      const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
      const best = sorted[0];
      return {
        quarter,
        name: best ? best[0] : 'N/A',
        count: best ? best[1] : 0
      };
    }).sort((a, b) => a.quarter.localeCompare(b.quarter));
  }, [filteredRecords]);

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this attendance record?")) {
      await attendanceService.deleteRecord(id);
      refreshData();
    }
  };

  const handleEditRecord = (record: AttendanceRecord) => {
    setEditingRecord(record);
  };

  const saveEditedRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingRecord) {
      await attendanceService.updateRecord(editingRecord.id, editingRecord.full_name, editingRecord.phone_number, editingRecord.ward);
      setEditingRecord(null);
      refreshData();
    }
  };

  const handleAddWard = (e: React.FormEvent) => {
    e.preventDefault();
    if (newWardName) {
      attendanceService.addWard(newWardName);
      setNewWardName('');
      refreshData();
    }
  };

  const handleDeleteWard = (name: string) => {
    if (window.confirm(`Remove ${name} from active wards?`)) {
      attendanceService.deleteWard(name);
      refreshData();
    }
  };

  const handleAddRoster = (e: React.FormEvent) => {
    e.preventDefault();
    if (newRosterName && newRosterWard) {
      attendanceService.addRosterMember(newRosterName, newRosterWard);
      setNewRosterName('');
      setNewRosterWard('');
      refreshData();
    }
  };

  const handleDeleteRoster = (name: string) => {
    if (window.confirm(`Remove ${name} from the roster?`)) {
      attendanceService.deleteRosterMember(name);
      refreshData();
    }
  };

  const downloadCSV = () => {
    if (filteredRecords.length === 0) return;
    
    const headers = ['Full Name', 'Phone Number', 'Unit', 'Date', 'Time Marked'];
    if (dashboardType === 'Skills Acquisition') {
      headers.push('Skill');
    } else if (dashboardType === 'Institute Cluster') {
      headers.push('Cluster');
    } else if (dashboardType === 'Missionary Preparatory Class') {
      headers.push('Designation');
    }

    const csvRows = filteredRecords.map(r => {
      const formattedTime = new Date(r.timestamp).toLocaleString('en-US', {
        timeZone: 'Africa/Lagos',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      });

      const row = [
        `"${(r.full_name || '').replace(/"/g, '""')}"`,
        `"${r.phone_number || ''}"`,
        `"${r.ward || ''}"`,
        `"${r.date}"`,
        `"${formattedTime}"`
      ];

      if (dashboardType === 'Skills Acquisition' || dashboardType === 'Institute Cluster' || dashboardType === 'Missionary Preparatory Class') {
        row.push(`"${(r.skillCategory || '').replace(/"/g, '""')}"`);
      }

      return row.join(',');
    });
    
    const csvContent = [headers.join(','), ...csvRows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);

    let filename = 'Attendance_Export';
    if (dashboardType === 'Institute Cluster' && filterCluster) {
      filename += `_${filterCluster}`;
    } else if (dashboardType === 'Skills Acquisition' && filterSkill) {
      filename += `_${filterSkill}`;
    }

    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadSummaryCSV = () => {
    if (filteredRecords.length === 0) return;

    const headers = ['Ward/Branch', 'S/N', 'Full Name', 'Phone Number', 'Date', 'Time Marked'];
    if (dashboardType === 'Skills Acquisition') {
      headers.push('Skill');
    } else if (dashboardType === 'Institute Cluster') {
      headers.push('Cluster');
    } else if (dashboardType === 'Missionary Preparatory Class') {
      headers.push('Designation');
    }

    const rows: string[] = [];
    
    // Group records by ward
    const grouped: Record<string, typeof filteredRecords> = {};
    filteredRecords.forEach(r => {
      const w = r.ward || 'Unknown';
      if (!grouped[w]) grouped[w] = [];
      grouped[w].push(r);
    });

    // Sort the wards alphabetically
    const sortedWards = Object.keys(grouped).sort((a, b) => a.localeCompare(b));

    sortedWards.forEach(ward => {
      const wardRecords = grouped[ward];
      // Separator row for visual organization in Excel
      rows.push(`"--- ${ward.toUpperCase()} ---",,,,,`);
      
      wardRecords.forEach((r, idx) => {
        const formattedTime = new Date(r.timestamp).toLocaleString('en-US', {
          timeZone: 'Africa/Lagos', year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true
        });
        
        const rowData = [
          `"${ward}"`,
          `"${idx + 1}"`,
          `"${(r.full_name || '').replace(/"/g, '""')}"`,
          `"${r.phone_number || ''}"`,
          `"${r.date}"`,
          `"${formattedTime}"`
        ];

        if (dashboardType === 'Skills Acquisition' || dashboardType === 'Institute Cluster' || dashboardType === 'Missionary Preparatory Class') {
          rowData.push(`"${(r.skillCategory || '').replace(/"/g, '""')}"`);
        }

        rows.push(rowData.join(','));
      });
      
      // Subtotal for the ward
      rows.push(`"TOTAL ${ward.toUpperCase()}", "${wardRecords.length}",,,,`);
      rows.push(''); // Empty row spacing
    });

    // Grand Total
    rows.push(`"GRAND TOTAL", "${filteredRecords.length}",,,,`);

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);

    let filename = 'Attendance_Organized_Summary';
    if (dashboardType === 'Institute Cluster' && filterCluster) {
      filename += `_${filterCluster}`;
    } else if (dashboardType === 'Skills Acquisition' && filterSkill) {
      filename += `_${filterSkill}`;
    }

    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const tabs: AdminTab[] = ['analytics', 'records', 'sheets', 'settings'];

  return (
    <div className="space-y-8 pb-20 font-sans relative">
      {/* Ambient Background */}
      <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[50vw] h-[50vw] bg-indigo-100/40 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-[50vw] h-[50vw] bg-blue-50/60 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/4" />
      </div>

      {/* Enterprise Header */}
      <header className="relative bg-slate-900 p-8 rounded-[2rem] border border-slate-800 shadow-2xl overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6 group isolate ring-1 ring-white/10">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=2000&q=80"
            alt="Header Background"
            className="w-full h-full object-cover opacity-20 mix-blend-overlay group-hover:scale-105 transition-transform duration-1000"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900/95 to-slate-900/40" />
        </div>

        <div className="relative z-10">
          <h2 className="text-3xl font-black text-white tracking-tight mb-2">Admin Console</h2>
          <p className="text-slate-300 text-sm font-medium max-w-md leading-relaxed">
            Overview of attendance, metrics, and system configurations.
          </p>
        </div>

        <div className="relative z-10 flex flex-col md:flex-row items-center gap-4">
          <div className="flex items-center gap-3 px-4 py-2 bg-white/10 backdrop-blur-md rounded-xl border border-white/10 text-white">
            {user?.photoURL ? (
              <img
                src={user.photoURL}
                alt="Profile"
                className="w-8 h-8 rounded-full border-2 border-white/20"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold text-xs shadow-inner">
                {user?.email?.[0]?.toUpperCase() || 'A'}
              </div>
            )}
            <div className="text-sm font-bold pr-2">
              {user?.displayName || user?.email?.split('@')[0] || 'Administrator'}
            </div>
          </div>

          <div className="flex bg-white/10 backdrop-blur-md p-1 rounded-xl border border-white/10">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wide transition-all ${activeTab === tab
                  ? 'bg-white text-slate-900 shadow-lg'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`}
              >
                {tab === 'settings' ? 'Setup' : tab}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Program Selector */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 p-1">
        {[
          { id: 'Friday Gathering', label: 'Institute of Religion', icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg> },
          { id: 'Skills Acquisition', label: 'Skills Acquisition', icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg> },
          { id: 'Institute Cluster', label: 'Institute Cluster', icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg> },
          { id: 'Missionary Preparatory Class', label: 'Missionary Prep', icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
          { id: 'Missionary Departure', label: 'Missionary Departure', icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg> },
          { id: 'Devotional', label: 'Devotional', icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg> },
          { id: 'Movie Night', label: 'Movie Night', icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" /></svg> },
        ].map((program) => (
          <button
            key={program.id}
            onClick={() => setDashboardType(program.id as any)}
            className={`px-4 py-4 rounded-2xl border transition-all flex items-center gap-3 text-left group relative overflow-hidden ${dashboardType === program.id
              ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl shadow-indigo-500/20 scale-[1.02]'
              : 'bg-white/80 backdrop-blur-sm border-slate-200 text-slate-600 hover:border-indigo-300 hover:bg-white hover:shadow-lg hover:-translate-y-0.5'
              }`}
          >
            <div className={`p-2.5 rounded-xl transition-colors ${dashboardType === program.id ? 'bg-white/20' : 'bg-slate-100 group-hover:bg-indigo-50 text-indigo-600'}`}>
              {program.icon}
            </div>
            <span className="text-xs font-bold uppercase tracking-wide">{program.label}</span>
          </button>
        ))}
      </div>

      {editingRecord && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl animate-in zoom-in duration-300 border border-slate-100">
            <h3 className="text-xl font-bold text-slate-900 mb-6">Edit Record</h3>
            <form onSubmit={saveEditedRecord} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Full Name</label>
                <input
                  type="text"
                  value={editingRecord.full_name}
                  onChange={(e) => setEditingRecord({ ...editingRecord, full_name: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-lg px-4 py-2.5 text-sm font-medium text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Phone Number</label>
                <input
                  type="tel"
                  value={editingRecord.phone_number}
                  onChange={(e) => setEditingRecord({ ...editingRecord, phone_number: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-lg px-4 py-2.5 text-sm font-medium text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Unit</label>
                <select
                  value={editingRecord.ward}
                  onChange={(e) => setEditingRecord({ ...editingRecord, ward: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-lg px-4 py-2.5 text-sm font-medium text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                  required
                >
                  {wards.map(w => <option key={w} value={w}>{w}</option>)}
                </select>
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setEditingRecord(null)} className="flex-1 py-2.5 bg-white border border-slate-300 rounded-lg font-semibold text-slate-700 hover:bg-slate-50 transition-colors text-sm">Cancel</button>
                <button type="submit" className="flex-1 py-2.5 bg-indigo-600 rounded-lg font-semibold text-white hover:bg-indigo-700 transition-colors text-sm shadow-sm">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {activeTab === 'analytics' && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {dashboardType === 'Skills Acquisition' && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {SKILLS.map(skill => {
                const count = filteredRecords.filter(r => r.skillCategory === skill).length;
                return (
                  <div key={skill} className="bg-white/80 backdrop-blur-sm p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center justify-center hover:border-indigo-300 hover:shadow-md transition-all group">
                    <span className="text-xs font-semibold text-slate-500 group-hover:text-indigo-600 uppercase tracking-wide mb-1 text-center transition-colors">{skill}</span>
                    <span className="text-2xl font-bold text-slate-900 group-hover:text-indigo-700 transition-colors">{count}</span>
                  </div>
                );
              })}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard
              title="Total Check-ins"
              value={filteredRecords.length.toString()}
              trend="History"
              icon="users"
              color="blue"
              bgImage="https://images.unsplash.com/photo-1543269865-cbf427effbad?auto=format&fit=crop&w=400&q=80"
            />
            <KpiCard
              title="Engaged Units"
              value={wardData.length.toString()}
              trend="Active"
              icon="home"
              color="emerald"
              bgImage="https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&w=400&q=80"
            />
            <KpiCard
              title="Daily Peak"
              value={(dailyData.reduce((max, d) => Math.max(max, d.count), 0)).toString()}
              trend="Record"
              icon="chart"
              color="indigo"
              bgImage="https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=400&q=80"
            />
            <KpiCard
              title="Avg per Week"
              value={Math.round(filteredRecords.length / 4).toString()}
              trend="Average"
              icon="calendar"
              color="slate"
              bgImage="https://images.unsplash.com/photo-1506784983877-45594efa4cbe?auto=format&fit=crop&w=400&q=80"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <ChartContainer title="Daily Attendance">
                <AnalyticsCharts type="line" data={dailyData} dataKey="count" xKey="date" />
              </ChartContainer>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <ChartContainer title="Unit Participation">
                  <AnalyticsCharts type="bar" data={wardData} dataKey="count" xKey="ward" />
                </ChartContainer>
                {dashboardType === 'Skills Acquisition' || dashboardType === 'Institute Cluster' || dashboardType === 'Missionary Preparatory Class' ? (
                  <ChartContainer title={
                    dashboardType === 'Skills Acquisition' ? "Skills Distribution" :
                      (dashboardType === 'Institute Cluster' ? "Cluster Distribution" : "Designation Distribution")
                  }>
                    <AnalyticsCharts type="bar" data={skillsData} dataKey="count" xKey="name" />
                  </ChartContainer>
                ) : (
                  <ChartContainer title="Quarterly View">
                    <AnalyticsCharts type="bar" data={quarterlyData} dataKey="count" xKey="quarter" />
                  </ChartContainer>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <ChartContainer title="Top Attendees">
                <AnalyticsCharts type="bar" data={topAttendees} dataKey="count" xKey="name" />
              </ChartContainer>

              <div className="space-y-6">
                <div className="bg-white/90 backdrop-blur-sm p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
                  <div className="absolute -top-6 -right-6 w-32 h-32 opacity-10 pointer-events-none rotate-12">
                    <img src="https://cdn-icons-png.flaticon.com/512/864/864837.png" alt="Trophy" className="w-full h-full object-contain" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-4 relative z-10">Quarterly Champions</h3>
                  <div className="space-y-3">
                    {quarterlyChampions.length === 0 ? (
                      <p className="text-sm text-slate-400 italic">No data available</p>
                    ) : (
                      quarterlyChampions.map((q) => (
                        <div key={q.quarter} className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-xs shadow-inner ${q.quarter === 'Q1' ? 'bg-blue-100 text-blue-600' :
                              q.quarter === 'Q2' ? 'bg-emerald-100 text-emerald-600' :
                                q.quarter === 'Q3' ? 'bg-amber-100 text-amber-600' : 'bg-purple-100 text-purple-600'
                              }`}>
                              {q.quarter}
                            </div>
                            <div>
                              <span className="font-bold text-slate-800 text-sm block">{q.name}</span>
                              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Top Attendee</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-lg font-black text-slate-900 block leading-none">{q.count}</span>
                            <span className="text-[9px] text-slate-400 font-bold uppercase">Visits</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="bg-white/90 backdrop-blur-sm p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <h3 className="text-lg font-bold text-slate-900 mb-4">Most Punctual (Avg)</h3>
                  <div className="space-y-3">
                    {punctualAttendees.length === 0 ? (
                      <p className="text-sm text-slate-400 italic">No data available</p>
                    ) : (
                      punctualAttendees.map((p, i) => {
                        const rankColor = i === 0 ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                          i === 1 ? 'bg-slate-100 text-slate-700 border-slate-200' :
                            i === 2 ? 'bg-orange-100 text-orange-800 border-orange-200' : 'bg-slate-50 text-slate-500 border-slate-100';
                        const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`;

                        return (
                          <div key={p.name} className={`flex items-center justify-between p-3 rounded-xl border ${i < 3 ? 'border-transparent shadow-sm' : 'border-slate-100'} ${i === 0 ? 'bg-gradient-to-r from-yellow-50 to-white' : 'bg-white'}`}>
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${rankColor} border`}>
                                {medal}
                              </div>
                              <span className={`font-bold text-sm truncate max-w-[120px] ${i === 0 ? 'text-slate-900' : 'text-slate-700'}`}>{p.name}</span>
                            </div>
                            <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200 tabular-nums">{p.time}</span>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-1">
              <GeminiInsights records={filteredRecords} />
            </div>
          </div>
        </div>
      )}

      {activeTab === 'records' && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <div className="bg-white/80 backdrop-blur-md px-4 py-3 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 w-full md:w-auto overflow-x-auto">
              <div className="flex flex-col min-w-[120px]">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">From</span>
                <input
                  type="date"
                  className="text-sm font-medium outline-none text-slate-700 bg-transparent focus:text-indigo-600 transition-colors"
                  value={filterDateStart}
                  onChange={(e) => setFilterDateStart(e.target.value)}
                />
              </div>
              <div className="h-8 w-px bg-slate-200 shrink-0" />
              <div className="flex flex-col min-w-[120px]">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">To</span>
                <input
                  type="date"
                  className="text-sm font-medium outline-none text-slate-700 bg-transparent focus:text-indigo-600 transition-colors"
                  value={filterDateEnd}
                  onChange={(e) => setFilterDateEnd(e.target.value)}
                />
              </div>
              {dashboardType === 'Skills Acquisition' && (
                <>
                  <div className="h-8 w-px bg-slate-200 shrink-0" />
                  <div className="flex flex-col min-w-[140px]">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Department</span>
                    <select
                      className="text-sm font-medium outline-none text-slate-700 bg-transparent cursor-pointer focus:text-indigo-600 transition-colors"
                      value={filterSkill}
                      onChange={(e) => setFilterSkill(e.target.value)}
                    >
                      <option value="">All Departments</option>
                      {SKILLS.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                </>
              )}
              {dashboardType === 'Institute Cluster' && (
                <>
                  <div className="h-8 w-px bg-slate-200 shrink-0" />
                  <div className="flex flex-col min-w-[140px]">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Cluster</span>
                    <select
                      className="text-sm font-medium outline-none text-slate-700 bg-transparent cursor-pointer focus:text-indigo-600 transition-colors"
                      value={filterCluster}
                      onChange={(e) => setFilterCluster(e.target.value)}
                    >
                      <option value="">All Clusters</option>
                      {CLUSTERS.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                </>
              )}
              {(filterDateStart || filterDateEnd) && (
                <button
                  onClick={() => { setFilterDateStart(''); setFilterDateEnd(''); }}
                  className="ml-4 text-[10px] font-bold text-slate-400 hover:text-red-600 uppercase tracking-wide transition-colors whitespace-nowrap"
                >
                  Clear Filters
                </button>
              )}
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <button
                onClick={downloadCSV}
                className="w-full sm:w-auto px-6 py-3 bg-indigo-600 text-white rounded-xl transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 font-semibold text-xs uppercase tracking-wide hover:bg-indigo-700 hover:scale-105"
              >
                Export Detailed CSV
              </button>
              <button
                onClick={downloadSummaryCSV}
                className="w-full sm:w-auto px-6 py-3 bg-slate-800 text-white rounded-xl transition-all shadow-lg shadow-slate-900/20 flex items-center justify-center gap-2 font-semibold text-xs uppercase tracking-wide hover:bg-slate-900 hover:scale-105"
              >
                Export Summary CSV
              </button>
            </div>
          </div>
          <AttendanceTable
            records={filteredRecords}
            onDelete={handleDelete}
            onEdit={handleEditRecord}
            subCategoryLabel={
              dashboardType === 'Skills Acquisition' ? 'Skill' :
                (dashboardType === 'Institute Cluster' ? 'Cluster' :
                  (dashboardType === 'Missionary Preparatory Class' ? 'Designation' : undefined))
            }
          />
        </div>
      )}

      {activeTab === 'sheets' && (
        <AttendanceSheets records={records} wards={wards} eventType={dashboardType} />
      )}

      {activeTab === 'settings' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="bg-white/90 backdrop-blur-sm p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Access Credentials</h3>
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1 block">Admin Password</label>
              <code className="text-base font-bold text-indigo-700 font-mono">{ADMIN_PASSWORD}</code>
            </div>

            {/* Data Maintenance Section */}
            <div className="mt-8 pt-8 border-t border-slate-200">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Data Maintenance</h3>
              <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                <p className="text-xs font-bold text-amber-700 uppercase tracking-wide mb-3">Migrate Records</p>
                <div className="flex flex-col gap-3">
                  <button
                    onClick={async () => {
                      if (window.confirm("Migrate today's (Feb 3) Institute records to Jan 30? This cannot be undone.")) {
                        try {
                          const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Lagos' });
                          // We specifically target the date user asked for.
                          // User said "today" (Feb 3) to "last week which is 30th" (Jan 30)
                          // Assuming 'today' is the recorded date of the records.
                          // Just to be safe, we'll use the hardcoded string matching the user's intent context
                          // '2026-02-03' -> '2026-01-30'
                          const count = await attendanceService.migrateRecords('2026-02-03', '2026-01-30');
                          alert(`Successfully migrated ${count} records.`);
                          refreshData();
                        } catch (e) {
                          alert("Migration failed. Check console.");
                        }
                      }
                    }}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold uppercase tracking-wide transition-colors shadow-sm text-left w-full"
                  >
                    Fix: Move Today's Institute to Jan 30
                  </button>
                  <p className="text-[10px] text-amber-600/80 leading-relaxed">
                    Use this to correct records if attendance was marked on the wrong day (e.g. marked today instead of last Friday).
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-sm p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col max-h-[600px]">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Manage Units</h3>
            <form onSubmit={handleAddWard} className="flex gap-2 mb-4">
              <input
                type="text"
                placeholder="New Unit name..."
                className="flex-1 px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                value={newWardName}
                onChange={(e) => setNewWardName(e.target.value)}
              />
              <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold uppercase tracking-wide hover:bg-indigo-700 transition-colors shadow-sm">Add</button>
            </form>
            <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
              {wards.map(w => (
                <div key={w} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200 group">
                  <span className="font-medium text-slate-700 text-sm">{w}</span>
                  <button onClick={() => handleDeleteWard(w)} className="text-slate-300 hover:text-red-500 p-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="md:col-span-2 bg-white/90 backdrop-blur-sm p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
              <h3 className="text-lg font-bold text-slate-900">Roster Management</h3>
              <div className="relative w-full sm:w-64">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Search members..."
                  className="w-full pl-10 pr-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400"
                  value={rosterSearch}
                  onChange={(e) => setRosterSearch(e.target.value)}
                />
              </div>
            </div>

            {/* Add Member Form */}
            <div className="bg-slate-50 p-5 rounded-lg border border-slate-200 mb-8">
              <p className="text-xs font-bold text-indigo-600 uppercase tracking-wide mb-3">Add New Member</p>
              <form onSubmit={handleAddRoster} className="flex flex-col sm:flex-row gap-4">
                <input
                  type="text"
                  placeholder="Full Name..."
                  className="flex-1 px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                  required
                  value={newRosterName}
                  onChange={(e) => setNewRosterName(e.target.value)}
                />
                <select
                  className="flex-1 px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                  required
                  value={newRosterWard}
                  onChange={(e) => setNewRosterWard(e.target.value)}
                >
                  <option value="" disabled>Select Unit...</option>
                  {wards.map(w => <option key={w} value={w}>{w}</option>)}
                </select>
                <button type="submit" className="px-6 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold uppercase tracking-wide hover:bg-indigo-700 transition-colors shadow-sm">Register</button>
              </form>
            </div>

            {/* Grouped Member List */}
            <div className="space-y-10">
              {groupedRoster.map(([wardName, members]) => (
                <div key={wardName} className="space-y-4">
                  <div className="flex items-center gap-4">
                    <h4 className="text-base font-bold text-slate-800">{wardName}</h4>
                    <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border border-indigo-100">
                      {members.length} Members
                    </span>
                    <div className="flex-1 h-px bg-slate-100" />
                  </div>

                  {members.length === 0 ? (
                    <p className="text-xs text-slate-400 italic pl-2">No members registered in this unit yet.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {members.map((m, idx) => (
                        <div key={idx} className="px-3 py-2 bg-white border border-slate-200 rounded-lg flex items-center justify-between group hover:border-indigo-300 transition-all">
                          <span className="text-sm font-medium text-slate-700">{m.name}</span>
                          <button onClick={() => handleDeleteRoster(m.name)} className="text-slate-300 hover:text-red-500 transition-colors p-1">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const KpiCard: React.FC<{ title: string; value: string; trend: string; icon: string; color: string; bgImage?: string }> = ({ title, value, trend, icon, color, bgImage }) => {
  const colorMap: Record<string, { bg: string, text: string, iconBg: string }> = {
    blue: { bg: 'bg-white', text: 'text-blue-600', iconBg: 'bg-blue-50 text-blue-600' },
    emerald: { bg: 'bg-white', text: 'text-emerald-600', iconBg: 'bg-emerald-50 text-emerald-600' },
    indigo: { bg: 'bg-white', text: 'text-indigo-600', iconBg: 'bg-indigo-50 text-indigo-600' },
    slate: { bg: 'bg-white', text: 'text-slate-600', iconBg: 'bg-slate-50 text-slate-600' },
  };

  const icons: Record<string, React.ReactNode> = {
    users: <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>,
    home: <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>,
    chart: <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>,
    calendar: <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
  };

  const style = colorMap[color];

  return (
    <div className={`${style.bg} relative p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-indigo-200 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group cursor-default overflow-hidden`}>
      {bgImage && (
        <div className="absolute inset-0 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-500">
          <img src={bgImage} alt="" className="w-full h-full object-cover grayscale" />
        </div>
      )}
      <div className="relative z-10 flex justify-between items-start mb-3">
        <div className={`${style.iconBg} p-2 rounded-lg`}>
          {icons[icon]}
        </div>
        <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500 bg-slate-50 px-2 py-1 rounded">{trend}</span>
      </div>
      <h4 className="relative z-10 text-xs font-semibold uppercase tracking-wide mb-1 text-slate-500">{title}</h4>
      <p className="relative z-10 text-2xl font-bold text-slate-900">{value}</p>
    </div>
  );
};

const ChartContainer: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="bg-white/90 backdrop-blur-sm p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col min-h-[300px] hover:shadow-md transition-shadow">
    <div className="mb-6 border-b border-slate-100 pb-4">
      <h3 className="text-lg font-bold text-slate-900">{title}</h3>
    </div>
    <div className="flex-1 w-full min-h-0">
      {children}
    </div>
  </div>
);

export default AdminDashboard;
