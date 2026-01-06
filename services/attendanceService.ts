
import { AttendanceRecord } from '../types';
import { MOCK_RECORDS, WARDS, MEMBER_ROSTER, RosterMember } from '../constants';

const RECORDS_KEY = 'ysa_attendance_records';
const WARDS_KEY = 'ysa_wards_list';
const ROSTER_KEY = 'ysa_roster_list';

const generateId = () => Math.random().toString(36).substring(2, 11) + Date.now().toString(36);

export const attendanceService = {
  getRecords: (): AttendanceRecord[] => {
    const stored = localStorage.getItem(RECORDS_KEY);
    if (!stored) {
      localStorage.setItem(RECORDS_KEY, JSON.stringify(MOCK_RECORDS));
      return MOCK_RECORDS;
    }
    try {
      return JSON.parse(stored);
    } catch (e) {
      return MOCK_RECORDS;
    }
  },

  saveRecord: (name: string, phone: string, ward: string): { success: boolean; message: string } => {
    const records = attendanceService.getRecords();
    const today = new Date().toISOString().split('T')[0];

    const isDuplicate = records.some(
      (r) => r.full_name.toLowerCase() === name.toLowerCase() && 
             r.ward === ward && 
             r.date === today
    );

    if (isDuplicate) {
      return { success: false, message: 'You have already marked attendance for today.' };
    }

    const newRecord: AttendanceRecord = {
      id: generateId(),
      full_name: name,
      phone_number: phone,
      ward: ward,
      date: today,
      timestamp: Date.now()
    };

    records.push(newRecord);
    localStorage.setItem(RECORDS_KEY, JSON.stringify(records));
    return { success: true, message: 'Attendance marked successfully!' };
  },

  updateRecord: (id: string, name: string, phone: string, ward: string): void => {
    const records = attendanceService.getRecords();
    const index = records.findIndex(r => r.id === id);
    if (index !== -1) {
      records[index] = { ...records[index], full_name: name, phone_number: phone, ward };
      localStorage.setItem(RECORDS_KEY, JSON.stringify(records));
    }
  },

  deleteRecord: (id: string): void => {
    const records = attendanceService.getRecords();
    const filtered = records.filter(r => r.id !== id);
    localStorage.setItem(RECORDS_KEY, JSON.stringify(filtered));
  },

  getWards: (): string[] => {
    const stored = localStorage.getItem(WARDS_KEY);
    if (!stored) {
      localStorage.setItem(WARDS_KEY, JSON.stringify(WARDS));
      return WARDS;
    }
    try {
      return JSON.parse(stored);
    } catch (e) {
      return WARDS;
    }
  },

  addWard: (wardName: string): void => {
    const wards = attendanceService.getWards();
    if (!wards.includes(wardName)) {
      wards.push(wardName);
      localStorage.setItem(WARDS_KEY, JSON.stringify(wards));
    }
  },

  deleteWard: (wardName: string): void => {
    const wards = attendanceService.getWards().filter(w => w !== wardName);
    localStorage.setItem(WARDS_KEY, JSON.stringify(wards));
  },

  getRoster: (): RosterMember[] => {
    const stored = localStorage.getItem(ROSTER_KEY);
    if (!stored) {
      localStorage.setItem(ROSTER_KEY, JSON.stringify(MEMBER_ROSTER));
      return MEMBER_ROSTER;
    }
    try {
      return JSON.parse(stored);
    } catch (e) {
      return MEMBER_ROSTER;
    }
  },

  addRosterMember: (name: string, ward: string): void => {
    const roster = attendanceService.getRoster();
    roster.push({ name, ward });
    localStorage.setItem(ROSTER_KEY, JSON.stringify(roster));
  },

  deleteRosterMember: (name: string): void => {
    const roster = attendanceService.getRoster().filter(m => m.name !== name);
    localStorage.setItem(ROSTER_KEY, JSON.stringify(roster));
  }
};
