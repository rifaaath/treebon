
"use server";

import { revalidatePath } from "next/cache";
import { addAdminBooking, getAvailabilityForDate, type DailyAvailability, updateBookingStatus as updateBookingStatusService, type Booking } from "@/services/bookingService";
import { format } from "date-fns";
import type { ManualAddBookingFormState } from "./schemas";
import { manualBookingFormSchema } from "./schemas";


export async function manualAddBookingAction(
  prevState: ManualAddBookingFormState,
  formData: FormData
): Promise<ManualAddBookingFormState> {
  
  const rawFormData = {
    name: formData.get("name"),
    phone: formData.get("phone"),
    eventDate: formData.get("eventDate") ? new Date(formData.get("eventDate") as string) : undefined,
    eventSlot: formData.get("eventSlot"),
    eventType: formData.get("eventType"),
    numberOfGuests: formData.get("numberOfGuests") ? parseInt(formData.get("numberOfGuests") as string, 10) : undefined,
    message: formData.get("message"),
    status: formData.get("status"),
  };

  const validatedFields = manualBookingFormSchema.safeParse(rawFormData);

  if (!validatedFields.success) {
    return {
      success: false,
      message: "Validation failed. Please check your inputs.",
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  try {
    const result = await addAdminBooking(validatedFields.data);
    if (result.success) {
      revalidatePath("/admin/bookings");
      revalidatePath("/availability"); 
      return { success: true, message: `Booking for ${validatedFields.data.name} on ${format(validatedFields.data.eventDate, "PPP")} (${validatedFields.data.eventSlot}) added successfully.` };
    } else {
      return { 
        success: false, 
        message: result.error || "Failed to add booking.", 
        errors: {_form: [result.error || "An unexpected server error occurred."]} 
      };
    }
  } catch (error) {
    console.error("Error in manualAddBookingAction:", error);
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred.";
    return { 
      success: false, 
      message: errorMessage, 
      errors: {_form: [errorMessage]} 
    };
  }
}

export async function getSlotAvailabilityAction(date: Date | undefined | null): Promise<DailyAvailability | null> {
  if (!date) return null;
  try {
    // Ensure the date passed to getAvailabilityForDate is a clean date object without time if necessary
    const cleanDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    return await getAvailabilityForDate(cleanDate);
  } catch (error) {
    console.error("Error fetching slot availability via action:", error);
    return null; 
  }
}

export interface UpdateBookingStatusFormState {
  success: boolean;
  message: string;
  error?: string; // General error message
}

export async function updateBookingStatusAction(
  bookingId: string,
  newStatus: Booking['status'],
  adminNotes?: string
): Promise<UpdateBookingStatusFormState> {
  if (!bookingId || !newStatus) {
    return { success: false, message: "Booking ID and new status are required." };
  }

  try {
    // Assuming 'system_admin' until proper admin auth is in place
    const result = await updateBookingStatusService(bookingId, newStatus, adminNotes, 'system_admin'); 
    if (result.success) {
      revalidatePath("/admin/bookings");
      revalidatePath("/availability"); // Revalidate public availability page
      return { success: true, message: `Booking status updated to ${newStatus}.` };
    } else {
      return { success: false, message: result.error || `Failed to update booking status to ${newStatus}.` };
    }
  } catch (error) {
    console.error(`Error in updateBookingStatusAction for booking ${bookingId}:`, error);
    const errorMessage = error instanceof Error ? error.message : "An unexpected server error occurred.";
    return { success: false, message: errorMessage };
  }
}
