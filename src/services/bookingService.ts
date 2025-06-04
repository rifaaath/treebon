
'use server';

import { db } from '@/lib/firebase';
import { collection, doc, getDoc, setDoc, addDoc, Timestamp, query, where, getDocs, deleteDoc, orderBy, writeBatch, runTransaction, documentId } from 'firebase/firestore';
import type { BookingFormValues } from '@/app/availability/actions';
import type { ManualBookingFormValues } from '@/app/admin/bookings/schemas';


export type SlotStatus = 'available' | 'booked' | 'pending';

export interface DailyAvailability {
  morning: SlotStatus;
  evening: SlotStatus;
}

export interface Holiday {
  id: string; // dateString YYYY-MM-DD
  name: string;
  date: Date;
}

// Define the structure of a Booking object, including server-generated fields
export interface Booking extends BookingFormValues {
  id: string; // Firestore document ID
  status: 'pending' | 'confirmed' | 'cancelled'; // Possible booking statuses
  createdAt: Date; // Timestamp of booking creation
  updatedAt?: Date; // Timestamp of last update
  eventDate: Date; // Ensure this is Date for client, converted from Timestamp
  message?: string; // Optional message from booking form
}

export interface AuditLogEntry {
  id: string; // Firestore document ID for the log entry
  timestamp: Date;
  userId: string; // For now, 'system_admin' or 'public_user'
  action: string; // e.g., "booking_created", "status_changed"
  previousStatus?: Booking['status'];
  newStatus?: Booking['status'];
  notes?: string; // Admin notes for the action
  details?: Record<string, any>; // Any other relevant details
}


function getDateString(date: Date): string {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Firestore collection names
const AVAILABILITY_COLLECTION = 'availability';
const HOLIDAYS_COLLECTION = 'holidays';
const BOOKINGS_COLLECTION = 'bookings';
const AUDIT_LOG_SUBCOLLECTION = 'auditLog';


async function addAuditLogEntry(
  bookingId: string,
  entryData: Omit<AuditLogEntry, 'id' | 'timestamp'>
): Promise<void> {
  try {
    const logRef = collection(db, BOOKINGS_COLLECTION, bookingId, AUDIT_LOG_SUBCOLLECTION);
    await addDoc(logRef, {
      ...entryData,
      timestamp: Timestamp.now(),
    });
  } catch (error) {
    console.error(`Error adding audit log for booking ${bookingId}:`, error);
    // Decide if this error should be propagated or just logged
  }
}


export async function getAvailabilityForDate(date: Date): Promise<DailyAvailability> {
  if (!date) {
    return { morning: 'available', evening: 'available' };
  }
  const dateString = getDateString(date);
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (date < today) {
    return { morning: 'booked', evening: 'booked' };
  }

  try {
    const holidayDocRef = doc(db, HOLIDAYS_COLLECTION, dateString);
    const holidaySnap = await getDoc(holidayDocRef);
    if (holidaySnap.exists()) {
      return { morning: 'booked', evening: 'booked' };
    }

    const availabilityDocRef = doc(db, AVAILABILITY_COLLECTION, dateString);
    const availabilitySnap = await getDoc(availabilityDocRef);

    if (availabilitySnap.exists()) {
      const data = availabilitySnap.data();
      const validStatuses: SlotStatus[] = ['available', 'booked', 'pending'];
      
      const morningStatus: SlotStatus = 
        data.morning && validStatuses.includes(data.morning as SlotStatus) 
        ? data.morning as SlotStatus 
        : 'available';
      
      const eveningStatus: SlotStatus = 
        data.evening && validStatuses.includes(data.evening as SlotStatus)
        ? data.evening as SlotStatus
        : 'available';
        
      return { morning: morningStatus, evening: eveningStatus };
    } else {
      return { morning: 'available', evening: 'available' };
    }
  } catch (error) {
    console.error(`Error fetching availability for ${dateString} from Firestore:`, error);
    return { morning: 'available', evening: 'available' }; 
  }
}

export async function markDateAsHoliday(date: Date, holidayName: string = "Holiday"): Promise<{success: boolean, error?: string}> {
  const dateString = getDateString(date);
  const holidayDocRef = doc(db, HOLIDAYS_COLLECTION, dateString);
  try {
    await setDoc(holidayDocRef, { name: holidayName, date: Timestamp.fromDate(date) });
    const availabilityDocRef = doc(db, AVAILABILITY_COLLECTION, dateString);
    await setDoc(availabilityDocRef, { morning: 'booked', evening: 'booked' }, { merge: true });
    return { success: true };
  } catch (error) {
    console.error("Error marking date as holiday:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

export async function removeHoliday(dateString: string): Promise<{success: boolean, error?: string}> {
  const holidayDocRef = doc(db, HOLIDAYS_COLLECTION, dateString);
  try {
    await deleteDoc(holidayDocRef);
    const dateObj = new Date(dateString + 'T00:00:00'); 
    await refreshSlotAvailabilityForDate(dateObj);
    return { success: true };
  } catch (error) {
    console.error("Error removing holiday:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}


export async function getAllHolidays(): Promise<Holiday[]> {
  try {
    const holidaysQuery = query(collection(db, HOLIDAYS_COLLECTION), orderBy("date", "asc"));
    const querySnapshot = await getDocs(holidaysQuery);
    const holidays: Holiday[] = [];
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      holidays.push({
        id: docSnap.id, 
        name: data.name,
        date: (data.date as Timestamp).toDate(),
      });
    });
    return holidays;
  } catch (error) {
    console.error("Error fetching all holidays:", error);
    return [];
  }
}

async function refreshSlotAvailabilityForDate(date: Date, specificSlot?: 'morning' | 'evening'): Promise<void> {
  const dateString = getDateString(date);
  const availabilityDocRef = doc(db, AVAILABILITY_COLLECTION, dateString);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (date < today) { 
    await setDoc(availabilityDocRef, { morning: 'booked', evening: 'booked' }, { merge: true });
    return;
  }

  const holidayDocRef = doc(db, HOLIDAYS_COLLECTION, dateString);
  const holidaySnap = await getDoc(holidayDocRef);
  if (holidaySnap.exists()) { 
    await setDoc(availabilityDocRef, { morning: 'booked', evening: 'booked' }, { merge: true });
    return;
  }

  const slotsToRefresh: ('morning' | 'evening')[] = specificSlot ? [specificSlot] : ['morning', 'evening'];
  const availabilityUpdate: Partial<DailyAvailability> = {};

  for (const slot of slotsToRefresh) {
    const bookingsQuery = query(
      collection(db, BOOKINGS_COLLECTION),
      where("eventDate", "==", Timestamp.fromDate(date)),
      where("eventSlot", "==", slot)
    );
    const slotBookingsSnap = await getDocs(bookingsQuery);
    
    let newSlotStatus: SlotStatus = 'available';
    if (!slotBookingsSnap.empty) {
      const hasConfirmed = slotBookingsSnap.docs.some(d => d.data().status === 'confirmed');
      const hasPending = slotBookingsSnap.docs.some(d => d.data().status === 'pending' && !hasConfirmed); // only pending if not already confirmed
      
      if (hasConfirmed) {
        newSlotStatus = 'booked';
      } else if (hasPending) {
        newSlotStatus = 'pending';
      }
    }
    availabilityUpdate[slot] = newSlotStatus;
  }
  
  if (Object.keys(availabilityUpdate).length > 0) {
     await setDoc(availabilityDocRef, availabilityUpdate, { merge: true });
  } else if (!specificSlot) { 
     await setDoc(availabilityDocRef, { morning: 'available', evening: 'available'}, { merge: true });
  }
}


export async function updateSlotAvailability(date: Date, slot: 'morning' | 'evening', status: SlotStatus): Promise<void> {
  await refreshSlotAvailabilityForDate(date, slot);
}


export async function createBooking(bookingData: BookingFormValues): Promise<{success: boolean, bookingId?: string, error?: string}> {
  try {
    const availability = await getAvailabilityForDate(bookingData.eventDate);
    if (availability[bookingData.eventSlot] !== 'available') {
      return { success: false, error: `The selected slot (${bookingData.eventSlot}) on ${getDateString(bookingData.eventDate)} is no longer available.` };
    }

    const bookingPayload = {
      ...bookingData,
      eventDate: Timestamp.fromDate(bookingData.eventDate), 
      status: 'pending' as Booking['status'], 
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };
    const docRef = await addDoc(collection(db, BOOKINGS_COLLECTION), bookingPayload);
    
    await addAuditLogEntry(docRef.id, {
      userId: 'public_user',
      action: 'booking_created',
      newStatus: 'pending',
      details: { name: bookingData.name, phone: bookingData.phone }
    });
    
    await refreshSlotAvailabilityForDate(bookingData.eventDate, bookingData.eventSlot);
    
    return { success: true, bookingId: docRef.id };
  } catch (error) {
    console.error("Error creating booking in Firestore:", error);
    let errorMessage = "Failed to create booking.";
    if (error instanceof Error) {
        errorMessage = error.message;
    }
    return { success: false, error: errorMessage };
  }
}


export async function addAdminBooking(bookingData: ManualBookingFormValues): Promise<{success: boolean, bookingId?: string, error?: string}> {
  try {
    const currentAvailability = await getAvailabilityForDate(bookingData.eventDate);
    if (bookingData.status === 'confirmed' && currentAvailability[bookingData.eventSlot] === 'booked') {
        const existingConfirmedBookings = await getDocs(query(
            collection(db, BOOKINGS_COLLECTION),
            where("eventDate", "==", Timestamp.fromDate(bookingData.eventDate)),
            where("eventSlot", "==", bookingData.eventSlot),
            where("status", "==", "confirmed")
        ));
        if (!existingConfirmedBookings.empty) {
             return { success: false, error: `The slot is already 'booked' by another confirmed booking. Cannot double book.` };
        }
    }

    const bookingPayload = {
      name: bookingData.name,
      phone: bookingData.phone,
      eventDate: Timestamp.fromDate(bookingData.eventDate),
      eventSlot: bookingData.eventSlot,
      eventType: bookingData.eventType,
      numberOfGuests: bookingData.numberOfGuests,
      message: bookingData.message,
      status: bookingData.status, 
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };
    const docRef = await addDoc(collection(db, BOOKINGS_COLLECTION), bookingPayload);
    
    await addAuditLogEntry(docRef.id, {
      userId: 'system_admin', 
      action: 'admin_booking_created',
      newStatus: bookingData.status,
      notes: 'Booking added manually via admin panel.',
      details: { name: bookingData.name }
    });
    
    await refreshSlotAvailabilityForDate(bookingData.eventDate, bookingData.eventSlot);
    
    return { success: true, bookingId: docRef.id };
  } catch (error) {
    console.error("Error adding admin booking in Firestore:", error);
    let errorMessage = "Failed to create booking via admin.";
    if (error instanceof Error) {
        errorMessage = error.message;
    }
    return { success: false, error: errorMessage };
  }
}


export async function updateBookingStatus(
  bookingId: string, 
  newStatus: Booking['status'], 
  adminNotes?: string,
  userId: string = 'system_admin' 
): Promise<{success: boolean, error?: string}> {
  const bookingRef = doc(db, BOOKINGS_COLLECTION, bookingId);
  
  interface TransactionResult {
    success: boolean;
    eventDate?: Date;
    eventSlot?: 'morning' | 'evening';
    previousStatus?: Booking['status'];
    error?: string;
  }

  try {
    const result: TransactionResult = await runTransaction(db, async (transaction) => {
      const bookingSnap = await transaction.get(bookingRef);
      if (!bookingSnap.exists()) {
        throw new Error("Booking not found.");
      }
      const bookingData = bookingSnap.data() as Omit<Booking, 'id'|'eventDate'|'createdAt'|'updatedAt'> & {eventDate: Timestamp, createdAt: Timestamp, updatedAt?: Timestamp};
      const previousStatus = bookingData.status;
      const eventDate = bookingData.eventDate.toDate();
      const eventSlot = bookingData.eventSlot;

      if (previousStatus === newStatus) {
        return { success: true, eventDate, eventSlot, previousStatus };
      }
      
      if (newStatus === 'confirmed') {
        const conflictingBookingsQuery = query(
          collection(db, BOOKINGS_COLLECTION),
          where("eventDate", "==", bookingData.eventDate), // Use the Timestamp from bookingData
          where("eventSlot", "==", eventSlot),
          where("status", "==", "confirmed"),
          where(documentId(), "!=", bookingId) 
        );
        // Firestore transactions require reads before writes. We perform the getDocs within the transaction.
        const conflictingBookingsSnap = await getDocs(conflictingBookingsQuery); // Not using transaction.get() for queries in v9+
        
        if (!conflictingBookingsSnap.empty) {
          throw new Error(`Cannot confirm booking. Slot is already booked by booking ID: ${conflictingBookingsSnap.docs[0].id}.`);
        }
      }

      transaction.update(bookingRef, { 
        status: newStatus,
        updatedAt: Timestamp.now()
      });
      
      return { success: true, eventDate, eventSlot, previousStatus };
    });

    if (result.success && result.eventDate && result.eventSlot) {
      await addAuditLogEntry(bookingId, { 
        userId: userId,
        action: 'status_changed',
        previousStatus: result.previousStatus,
        newStatus: newStatus,
        notes: adminNotes,
      });
      await refreshSlotAvailabilityForDate(result.eventDate, result.eventSlot);
      return { success: true };
    } else {
      return { success: false, error: result.error || "Transaction failed or post-transaction step failed."};
    }

  } catch (error) {
    console.error(`Error updating booking ${bookingId} status:`, error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error during status update.";
    return { success: false, error: errorMessage };
  }
}


export async function getBookingsForDate(date: Date): Promise<Booking[]> {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const bookingsRef = collection(db, BOOKINGS_COLLECTION);
  const q = query(bookingsRef, 
                  where("eventDate", ">=", Timestamp.fromDate(startOfDay)),
                  where("eventDate", "<=", Timestamp.fromDate(endOfDay)));
  
  try {
    const querySnapshot = await getDocs(q);
    const bookings: Booking[] = [];
    querySnapshot.forEach((docSnap) => {
      bookings.push(mapFirestoreDocToBooking(docSnap));
    });
    return bookings;
  } catch (error) {
    console.error("Error fetching bookings for date:", error);
    return [];
  }
}

export async function getAllBookings(): Promise<Booking[]> {
  try {
    const bookingsQuery = query(collection(db, BOOKINGS_COLLECTION), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(bookingsQuery);
    const bookings: Booking[] = [];
    querySnapshot.forEach((docSnap) => {
      bookings.push(mapFirestoreDocToBooking(docSnap));
    });
    return bookings;
  } catch (error)
   {
    console.error("Error fetching all bookings:", error);
    return [];
  }
}

// Helper to explicitly convert Booking data from Firestore for client-side use
// This is now an internal helper function, not exported.
function mapFirestoreDocToBooking(docSnap: any): Booking {
    const data = docSnap.data();
    return {
        id: docSnap.id,
        name: data.name,
        phone: data.phone,
        eventDate: (data.eventDate as Timestamp).toDate(),
        eventSlot: data.eventSlot,
        eventType: data.eventType,
        numberOfGuests: data.numberOfGuests,
        message: data.message || "",
        status: data.status as 'pending' | 'confirmed' | 'cancelled',
        createdAt: (data.createdAt as Timestamp).toDate(),
        updatedAt: data.updatedAt ? (data.updatedAt as Timestamp).toDate() : undefined,
    };
}
