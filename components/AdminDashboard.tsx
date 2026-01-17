
import React, { useState, useEffect, useMemo } from 'react';
import { User } from 'firebase/auth';
import { attendanceService } from '../services/attendanceService';
import { AttendanceRecord, WardStats, MonthlyStats, QuarterlyStats } from '../types';
import { ADMIN_PASSWORD, RosterMember } from '../constants';
import AttendanceTable from './AttendanceTable';
import AnalyticsCharts from './AnalyticsCharts';
import GeminiInsights from './GeminiInsights';

type AdminTab = 'analytics' | 'records' | 'settings';

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

const AdminDashboard: React.FC<AdminDashboardProps> = ({ user }) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('analytics');
  const [dashboardType, setDashboardType] = useState<'Friday Gathering' | 'Skills Acquisition' | 'Institute Cluster' | 'Missionary Preparatory Class'>('Friday Gathering');
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [wards, setWards] = useState<string[]>([]);
  const [roster, setRoster] = useState<RosterMember[]>([]);
  
  const [filterDateStart, setFilterDateStart] = useState('');
  const [filterDateEnd, setFilterDateEnd] = useState('');
  const [filterSkill, setFilterSkill] = useState('');

  const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(null);
  const [newWardName, setNewWardName] = useState('');
  const [newRosterName, setNewRosterName] = useState('');
  const [newRosterWard, setNewRosterWard] = useState('');

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
    return records.filter(r => {
      const isAfter = filterDateStart ? r.date >= filterDateStart : true;
      const isBefore = filterDateEnd ? r.date <= filterDateEnd : true;
      // Default to 'Friday Gathering' if eventType is missing (backward compatibility)
      const typeMatch = (r.eventType || 'Friday Gathering') === dashboardType;
      
      const skillMatch = dashboardType === 'Skills Acquisition' && filterSkill 
        ? r.skillCategory === filterSkill 
        : true;

      return isAfter && isBefore && typeMatch && skillMatch;
    });
  }, [records, filterDateStart, filterDateEnd, dashboardType, filterSkill]);

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
    
    roster.forEach(m => {
      if (!groups[m.ward]) groups[m.ward] = [];
      groups[m.ward].push(m);
    });

    // Sort names within each group
    Object.keys(groups).forEach(key => {
      groups[key].sort((a, b) => a.name.localeCompare(b.name));
    });

    return Object.entries(groups).sort((a, b) => a[0].localeCompare(b[0]));
  }, [roster, wards]);

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
    const headers = ['Full Name', 'Phone Number', 'Ward', 'Date', 'Timestamp'];
    const csvRows = filteredRecords.map(r => [
      `"${r.full_name.replace(/"/g, '""')}"`,
      `"${r.phone_number}"`,
      `"${r.ward}"`,
      r.date,
      new Date(r.timestamp).toISOString()
    ].join(','));
    const csvContent = [headers.join(','), ...csvRows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Attendance_Export.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const tabs: AdminTab[] = ['analytics', 'records', 'settings'];

  return (
    <div className="space-y-8 pb-20">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 bg-white p-6 md:p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-3 mb-2">
             <h2 className="text-3xl font-black text-slate-900 tracking-tight">Admin Console</h2>
          </div>
          <p className="text-slate-500 font-medium">Manage activity records & YSAs rosters.</p>
        </div>

          <div className="flex flex-col items-end gap-4">
          <div className="flex items-center gap-3 px-2">
            <div className="text-right hidden md:block">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Logged in as</p>
              <p className="text-sm font-bold text-slate-700">{user?.displayName || user?.email?.split('@')[0] || 'Admin'}</p>
            </div>
            {user?.photoURL ? (
              <img 
                src={user.photoURL} 
                alt="Profile" 
                className="w-10 h-10 rounded-full border-2 border-white shadow-md ring-2 ring-slate-100"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold border-2 border-white shadow-md ring-2 ring-slate-100">
                {user?.email?.[0]?.toUpperCase() || 'A'}
              </div>
            )}
          </div>

          <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  activeTab === tab 
                  ? 'bg-white text-indigo-900 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {tab === 'settings' ? 'Setup' : tab}
              </button>
            ))}
          </div>
          </div>
      </header>

      {/* Program Selector */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { id: 'Friday Gathering', label: 'Institute of Religion', icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg> },
          { id: 'Skills Acquisition', label: 'Skills Acquisition', icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg> },
          { id: 'Institute Cluster', label: 'Institute Cluster', icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg> },
          { id: 'Missionary Preparatory Class', label: 'Missionary Prep', icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
        ].map((program) => (
          <button
            key={program.id}
            onClick={() => setDashboardType(program.id as any)}
            className={`p-4 rounded-2xl border transition-all flex flex-col items-center justify-center gap-2 text-center group ${
              dashboardType === program.id
                ? 'bg-indigo-900 border-indigo-900 text-white shadow-lg scale-[1.02]'
                : 'bg-white border-slate-200 text-slate-500 hover:border-indigo-200 hover:bg-slate-50'
            }`}
          >
            <div className={`p-2 rounded-full transition-colors ${dashboardType === program.id ? 'bg-white/10' : 'bg-slate-100 group-hover:bg-white'}`}>
               {program.icon}
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest">{program.label}</span>
          </button>
        ))}
      </div>

      {editingRecord && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] p-8 max-w-md w-full shadow-2xl animate-in zoom-in duration-300">
            <h3 className="text-2xl font-black text-slate-900 mb-6 tracking-tight">Edit Record</h3>
            <form onSubmit={saveEditedRecord} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Full Name</label>
                <input 
                  type="text" 
                  value={editingRecord.full_name}
                  onChange={(e) => setEditingRecord({...editingRecord, full_name: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-900"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Phone Number</label>
                <input 
                  type="tel" 
                  value={editingRecord.phone_number}
                  onChange={(e) => setEditingRecord({...editingRecord, phone_number: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-900"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Unit</label>
                <select 
                  value={editingRecord.ward}
                  onChange={(e) => setEditingRecord({...editingRecord, ward: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-900"
                  required
                >
                  {wards.map(w => <option key={w} value={w}>{w}</option>)}
                </select>
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setEditingRecord(null)} className="flex-1 py-3 bg-slate-100 rounded-xl font-bold text-slate-600 hover:bg-slate-200 transition-colors">Cancel</button>
                <button type="submit" className="flex-1 py-3 bg-indigo-600 rounded-xl font-bold text-white hover:bg-indigo-700 transition-colors">Save</button>
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
                  <div key={skill} className="bg-white p-4 rounded-[1.5rem] border border-slate-200 shadow-sm flex flex-col items-center justify-center hover:shadow-md transition-shadow">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 text-center">{skill}</span>
                    <span className="text-2xl font-black text-slate-900">{count}</span>
                  </div>
                );
              })}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard title="Total Check-ins" value={filteredRecords.length.toString()} trend="History" icon="users" color="blue" />
            <KpiCard title="Engaged Units" value={wardData.length.toString()} trend="Active" icon="home" color="emerald" />
            <KpiCard title="Daily Peak" value={(dailyData.reduce((max, d) => Math.max(max, d.count), 0)).toString()} trend="Record" icon="chart" color="indigo" />
            <KpiCard title="Avg per Week" value={Math.round(filteredRecords.length / 4).toString()} trend="Average" icon="calendar" color="slate" />
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
            <div className="lg:col-span-1">
               <GeminiInsights records={filteredRecords} />
            </div>
          </div>
        </div>
      )}

      {activeTab === 'records' && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <div className="bg-white px-6 py-4 rounded-[2rem] border border-slate-200 shadow-sm flex items-center gap-6 w-full md:w-auto overflow-x-auto">
              <div className="flex flex-col min-w-[120px]">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">From</span>
                <input 
                  type="date" 
                  className="text-sm font-bold outline-none text-slate-700 bg-transparent"
                  value={filterDateStart}
                  onChange={(e) => setFilterDateStart(e.target.value)}
                />
              </div>
              <div className="h-8 w-px bg-slate-200 shrink-0" />
              <div className="flex flex-col min-w-[120px]">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">To</span>
                <input 
                  type="date" 
                  className="text-sm font-bold outline-none text-slate-700 bg-transparent"
                  value={filterDateEnd}
                  onChange={(e) => setFilterDateEnd(e.target.value)}
                />
              </div>
              {dashboardType === 'Skills Acquisition' && (
                <>
                  <div className="h-8 w-px bg-slate-200 shrink-0" />
                  <div className="flex flex-col min-w-[140px]">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Department</span>
                    <select 
                      className="text-sm font-bold outline-none text-slate-700 bg-transparent cursor-pointer"
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
            </div>
            <button 
              onClick={downloadCSV}
              className="w-full md:w-auto px-8 py-4 bg-indigo-900 text-white rounded-2xl transition-all shadow-xl flex items-center justify-center gap-3 font-black text-xs uppercase tracking-widest hover:bg-black"
            >
              Export Records
            </button>
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

      {activeTab === 'settings' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="bg-white p-6 md:p-10 rounded-[3rem] border border-slate-200 shadow-sm">
            <h3 className="text-xl font-black text-slate-900 mb-6">Access Credentials</h3>
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Admin Password</label>
              <code className="text-lg font-black text-indigo-900 tracking-widest">{ADMIN_PASSWORD}</code>
            </div>
          </div>

          <div className="bg-white p-6 md:p-10 rounded-[3rem] border border-slate-200 shadow-sm flex flex-col max-h-[600px]">
            <h3 className="text-xl font-black text-slate-900 mb-6">Manage Units</h3>
            <form onSubmit={handleAddWard} className="flex gap-2 mb-4">
              <input 
                type="text" 
                placeholder="New Unit name..." 
                className="flex-1 px-4 py-2 border rounded-xl text-sm font-bold outline-indigo-600 text-slate-900"
                value={newWardName}
                onChange={(e) => setNewWardName(e.target.value)}
              />
              <button type="submit" className="px-4 py-2 bg-indigo-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-black transition-colors">Add</button>
            </form>
            <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
               {wards.map(w => (
                 <div key={w} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 group">
                    <span className="font-bold text-slate-700">{w}</span>
                    <button onClick={() => handleDeleteWard(w)} className="text-slate-300 hover:text-red-500 p-1">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                    </button>
                 </div>
               ))}
            </div>
          </div>

          <div className="md:col-span-2 bg-white p-6 md:p-10 rounded-[3rem] border border-slate-200 shadow-sm">
            <h3 className="text-2xl font-black text-slate-900 mb-8">Roster Management</h3>
            
            {/* Add Member Form */}
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 mb-10">
              <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-4">Add New Member</p>
              <form onSubmit={handleAddRoster} className="flex flex-col sm:flex-row gap-4">
                 <input 
                   type="text" 
                   placeholder="Full Name..." 
                   className="flex-1 px-4 py-3 border rounded-xl text-sm font-bold text-slate-900"
                   required
                   value={newRosterName}
                   onChange={(e) => setNewRosterName(e.target.value)}
                 />
                 <select 
                   className="flex-1 px-4 py-3 border rounded-xl text-sm font-bold text-slate-900"
                   required
                   value={newRosterWard}
                   onChange={(e) => setNewRosterWard(e.target.value)}
                 >
                   <option value="" disabled>Select Unit...</option>
                   {wards.map(w => <option key={w} value={w}>{w}</option>)}
                 </select>
                 <button type="submit" className="px-8 py-3 bg-indigo-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-black transition-colors">Register</button>
              </form>
            </div>

            {/* Grouped Member List */}
            <div className="space-y-10">
               {groupedRoster.map(([wardName, members]) => (
                 <div key={wardName} className="space-y-4">
                    <div className="flex items-center gap-4">
                       <h4 className="text-lg font-black text-slate-800 tracking-tight">{wardName}</h4>
                       <span className="bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-widest border border-indigo-100">
                         {members.length} Members
                       </span>
                       <div className="flex-1 h-px bg-slate-100" />
                    </div>
                    
                    {members.length === 0 ? (
                      <p className="text-xs text-slate-400 italic pl-2">No members registered in this unit yet.</p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {members.map((m, idx) => (
                          <div key={idx} className="p-3 bg-white border border-slate-100 rounded-xl flex items-center justify-between group hover:shadow-sm transition-shadow">
                             <span className="text-sm font-bold text-slate-700">{m.name}</span>
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

const KpiCard: React.FC<{ title: string; value: string; trend: string; icon: string; color: string }> = ({ title, value, trend, icon, color }) => {
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
    <div className={`${style.bg} p-6 rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-md transition-shadow group cursor-default`}>
      <div className="flex justify-between items-start mb-4">
        <div className={`${style.iconBg} p-3 rounded-2xl transition-transform group-hover:scale-110`}>
          {icons[icon]}
        </div>
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-50 px-2 py-1 rounded-lg">{trend}</span>
      </div>
      <h4 className="text-xs font-bold uppercase tracking-[0.15em] mb-1 text-slate-400">{title}</h4>
      <p className="text-3xl font-black text-slate-900">{value}</p>
    </div>
  );
};

const ChartContainer: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="bg-white p-6 md:p-8 rounded-[3rem] border border-slate-200 shadow-sm flex flex-col min-h-[260px] md:min-h-[420px]">
    <div className="mb-8">
      <h3 className="text-xl font-black text-slate-900 tracking-tight">{title}</h3>
    </div>
    <div className="flex-1 w-full min-h-0">
      {children}
    </div>
  </div>
);

export default AdminDashboard;
