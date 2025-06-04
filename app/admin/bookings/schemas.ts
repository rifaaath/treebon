
import { z } from "zod";

// Schema for the manual booking form
export const manualBookingFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  phone: z.string().min(10, { message: "Phone number must be at least 10 digits." }).regex(/^\+?[0-9\s-()]+$/, "Invalid phone number format."),
  eventDate: z.date({ required_error: "Please select the event date."}),
  eventSlot: z.enum(["morning", "evening"], { required_error: "Please select morning or evening slot."}),
  eventType: z.string().min(3, { message: "Event type must be at least 3 characters." }),
  numberOfGuests: z.coerce.number().min(1, { message: "Number of guests must be at least 1." }).max(1000, {message: "Maximum 1000 guests."}),
  message: z.string().optional().default(""),
  status: z.enum(["pending", "confirmed"], { required_error: "Please select a status."}),
});

export type ManualBookingFormValues = z.infer<typeof manualBookingFormSchema>;

export interface ManualAddBookingFormState {
  success: boolean;
  message: string;
  errors?: {
    name?: string[];
    phone?: string[];
    eventDate?: string[];
    eventSlot?: string[];
    eventType?: string[];
    numberOfGuests?: string[];
    message?: string[];
    status?: string[];
    _form?: string[]; // For general form errors not tied to a specific field
  };
}
