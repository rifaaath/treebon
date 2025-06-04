
"use server";

import { z } from "zod";
import { createBooking } from "@/services/bookingService"; // Use the new service

// This schema should ideally match or be derived from the one in BookingForm
const bookingFormSchema = z.object({
  name: z.string().min(2),
  phone: z.string().min(10),
  eventDate: z.date(),
  eventSlot: z.enum(["morning", "evening"]),
  eventType: z.string().min(3),
  numberOfGuests: z.coerce.number().min(1),
  message: z.string().optional(),
});

export type BookingFormValues = z.infer<typeof bookingFormSchema>;

interface SubmitBookingResult {
  success: boolean;
  error?: string;
  data?: BookingFormValues; // Keep data for potential logging or confirmation
  bookingId?: string;
}

export async function submitBooking(
  data: BookingFormValues
): Promise<SubmitBookingResult> {
  const validation = bookingFormSchema.safeParse(data);

  if (!validation.success) {
    let errorMessages = "Invalid data: ";
    validation.error.errors.forEach(err => {
      errorMessages += `${err.path.join(".")}: ${err.message}. `;
    });
    console.error("Server-side validation failed:", validation.error.flatten().fieldErrors);
    return {
      success: false,
      error: errorMessages.trim(),
    };
  }

  try {
    const result = await createBooking(validation.data);
    if (result.success) {
      console.log("New Booking Request Received and Stored in Firestore. Booking ID:", result.bookingId);
      return { success: true, data: validation.data, bookingId: result.bookingId };
    } else {
      console.error("Failed to create booking via service:", result.error);
      return { success: false, error: result.error || "Failed to save booking." };
    }
  } catch (error) {
    console.error("Error submitting booking:", error);
    let errorMessage = "An unexpected error occurred while submitting the booking.";
    if (error instanceof Error) {
        errorMessage = error.message;
    }
    return { success: false, error: errorMessage };
  }
}
