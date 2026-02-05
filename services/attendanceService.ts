import { AttendanceRecord } from '../types';
import { MOCK_RECORDS, WARDS, MEMBER_ROSTER, RosterMember } from '../constants';
import { db } from './firebaseConfig';
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  Timestamp
} from 'firebase/firestore';

const RECORDS_COLLECTION = 'attendance_records';
const WARDS_COLLECTION = 'wards'; // You might want to create a document for settings instead
const ROSTER_COLLECTION = 'roster';

export const attendanceService = {
  // Fetch all records (Consider filtering by date in the UI if this gets too large)
  getRecords: async (): Promise<AttendanceRecord[]> => {
    try {
      const querySnapshot = await getDocs(collection(db, RECORDS_COLLECTION));
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as AttendanceRecord));
    } catch (e) {
      console.error("Error fetching records:", e);
      return [];
    }
  },

  saveRecord: async (name: string, phone: string, ward: string, eventType?: string, skillCategory?: string, date?: string): Promise<{ success: boolean; message: string }> => {
    // Use provided date or fallback to today (YYYY-MM-DD)
    const today = date || new Date().toISOString().split('T')[0];

    try {
      // Try to check for duplicates (This works for Admins, but might fail for Public due to security rules)
      try {
        const constraints = [
          where("full_name", "==", name),
          where("date", "==", today)
        ];

        if (eventType) {
          constraints.push(where("eventType", "==", eventType));
        }

        const q = query(collection(db, RECORDS_COLLECTION), ...constraints);

        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          return { success: false, message: 'You have already marked attendance for this event today.' };
        }
      } catch (permissionError) {
        // If public user can't read (Permission Denied), ignore duplicate check and proceed to save
        // This ensures the form still works with secure rules
      }

      // Add new record
      const recordData: any = {
        full_name: name,
        phone_number: phone,
        ward: ward,
        date: today,
        timestamp: Date.now()
      };

      if (eventType) recordData.eventType = eventType;
      if (skillCategory) recordData.skillCategory = skillCategory;

      await addDoc(collection(db, RECORDS_COLLECTION), recordData);
      return { success: true, message: 'Attendance marked successfully!' };
    } catch (e) {
      console.error("Error saving record:", e);
      return { success: false, message: 'Failed to save attendance. Please try again.' };
    }
  },

  updateRecord: async (id: string, name: string, phone: string, ward: string): Promise<void> => {
    const recordRef = doc(db, RECORDS_COLLECTION, id);
    await updateDoc(recordRef, {
      full_name: name,
      phone_number: phone,
      ward: ward
    });
  },

  deleteRecord: async (id: string): Promise<void> => {
    await deleteDoc(doc(db, RECORDS_COLLECTION, id));
  },

  // For simplicity, we will keep Wards and Roster static or local for now 
  // unless you want to manage them in DB too. 
  // Keeping them local ensures the form loads fast even with bad network.
  getWards: (): string[] => {
    return WARDS;
  },

  addWard: (wardName: string): void => {
    // Implementation for DB management of wards would go here
    console.log("Ward management currently static for stability");
  },

  deleteWard: (wardName: string): void => {
    console.log("Ward management currently static for stability");
  },

  getRoster: (): RosterMember[] => {
    return MEMBER_ROSTER;
  },

  addRosterMember: (name: string, ward: string): void => {
    console.log("Roster management currently static");
  },

  deleteRosterMember: (name: string): void => {
    console.log("Roster management currently static");
  },

  getDailyStats: async (): Promise<{ total: number; byWard: Record<string, number> }> => {
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Lagos' });
    // Query only today's records for efficiency
    const q = query(collection(db, RECORDS_COLLECTION), where("date", "==", today));
    const querySnapshot = await getDocs(q);

    const byWard: Record<string, number> = {};
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const ward = data.ward || 'Unknown';
      byWard[ward] = (byWard[ward] || 0) + 1;
    });

    return { total: querySnapshot.size, byWard };
  },

  migrateRecords: async (fromDate: string, toDate: string): Promise<number> => {
    try {
      const q = query(
        collection(db, RECORDS_COLLECTION),
        where("date", "==", fromDate)
      );

      const querySnapshot = await getDocs(q);
      const updates = querySnapshot.docs.map(async (docSnapshot) => {
        const recordRef = doc(db, RECORDS_COLLECTION, docSnapshot.id);
        await updateDoc(recordRef, {
          date: toDate
        });
      });

      await Promise.all(updates);
      console.log(`Migrated ${updates.length} records from ${fromDate} to ${toDate}`);
      return updates.length;
    } catch (e) {
      console.error("Error migrating records:", e);
      return 0;
    }
  }
};
