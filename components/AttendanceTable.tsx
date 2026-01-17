
import React from 'react';
import { AttendanceRecord } from '../types';

interface AttendanceTableProps {
  records: AttendanceRecord[];
  onDelete: (id: string) => void;
  onEdit: (record: AttendanceRecord) => void;
  showSkill?: boolean;
  subCategoryLabel?: string;
}

const AttendanceTable: React.FC<AttendanceTableProps> = ({ records, onDelete, onEdit, showSkill, subCategoryLabel }) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mt-6">
      <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
        <div>
          <h3 className="text-base font-bold text-slate-900">Records Ledger</h3>
          <p className="text-xs text-slate-500">Detailed history of all check-ins</p>
        </div>
        <div className="bg-white px-3 py-1 rounded-lg border border-slate-200 shadow-sm">
          <span className="text-xs font-bold text-indigo-600 uppercase tracking-wide">
            {records.length} Submissions
          </span>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/50">
              <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Phone</th>
              <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Ward</th>
              {(showSkill || subCategoryLabel) && <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">{subCategoryLabel || 'Skill'}</th>}
              <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {records.length === 0 ? (
              <tr>
                <td colSpan={(showSkill || subCategoryLabel) ? 6 : 5} className="px-8 py-20 text-center">
                  <div className="flex flex-col items-center">
                    <p className="text-slate-400 font-semibold uppercase tracking-wide text-xs">No records found</p>
                  </div>
                </td>
              </tr>
            ) : (
              records.map((record, idx) => (
                <tr key={record.id} className={`hover:bg-slate-50 transition-colors group ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}`}>
                  <td className="px-6 py-3">
                    <span className="font-medium text-slate-900 text-sm">{record.full_name}</span>
                  </td>
                  <td className="px-6 py-3">
                    <span className="text-slate-500 text-sm font-medium tabular-nums">
                      {record.phone_number || "---"}
                    </span>
                  </td>
                  <td className="px-6 py-3">
                    <span className="bg-indigo-50 text-indigo-700 border border-indigo-100 px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wide">
                      {record.ward}
                    </span>
                  </td>
                  {(showSkill || subCategoryLabel) && (
                    <td className="px-6 py-3">
                      <span className="text-slate-700 text-sm font-medium">
                        {record.skillCategory || '---'}
                      </span>
                    </td>
                  )}
                  <td className="px-6 py-3">
                    <span className="text-slate-500 text-sm">
                      {new Date(record.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-right flex justify-end gap-2">
                    <button 
                      onClick={() => onEdit(record)}
                      className="text-slate-400 hover:text-indigo-600 p-1.5 rounded-lg hover:bg-indigo-50 transition-all opacity-0 group-hover:opacity-100"
                      title="Edit Entry"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                      </svg>
                    </button>
                    <button 
                      onClick={() => onDelete(record.id)}
                      className="text-slate-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
                      title="Remove Entry"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AttendanceTable;
