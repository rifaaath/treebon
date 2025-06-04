
"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { markDateAsHoliday, removeHoliday as removeHolidayFromService } from "@/services/bookingService";
import { format } from "date-fns";

const holidaySchema = z.object({
  holidayName: z.string().min(2, { message: "Holiday name must be at least 2 characters." }),
  holidayDate: z.date({ required_error: "Please select a date for the holiday." }),
});

export interface AddHolidayFormState {
  success: boolean;
  message: string;
  errors?: {
    holidayName?: string[];
    holidayDate?: string[];
    _form?: string[];
  };
}

export async function addHolidayAction(
  prevState: AddHolidayFormState,
  formData: FormData
): Promise<AddHolidayFormState> {
  const rawFormData = {
    holidayName: formData.get("holidayName"),
    // The date from Calendar is already a Date object if react-hook-form is used correctly on client
    // If not, it might be a string that needs parsing.
    // For robustness with raw FormData, let's assume it could be a string.
    holidayDate: formData.get("holidayDate") ? new Date(formData.get("holidayDate") as string) : undefined,
  };

  const validatedFields = holidaySchema.safeParse(rawFormData);

  if (!validatedFields.success) {
    return {
      success: false,
      message: "Validation failed. Please check your inputs.",
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { holidayName, holidayDate } = validatedFields.data;

  // Ensure date is not in the past (optional, but good practice)
  const today = new Date();
  today.setHours(0,0,0,0);
  if (holidayDate < today) {
     return {
        success: false,
        message: "Cannot add holiday in the past.",
        errors: { holidayDate: ["Holiday date cannot be in the past."] },
    };
  }


  try {
    const result = await markDateAsHoliday(holidayDate, holidayName);
    if (result.success) {
      revalidatePath("/admin/holidays");
      revalidatePath("/availability"); // Also revalidate public availability page
      return { success: true, message: `Successfully added '${holidayName}' on ${format(holidayDate, "PPP")}.` };
    } else {
      return { success: false, message: result.error || "Failed to add holiday.", errors: {_form: [result.error || "Server error."]} };
    }
  } catch (error) {
    console.error("Error in addHolidayAction:", error);
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred.";
    return { success: false, message: errorMessage, errors: {_form: [errorMessage]} };
  }
}

export interface RemoveHolidayState {
    success: boolean;
    message: string;
}

export async function removeHolidayAction(dateString: string): Promise<RemoveHolidayState> {
  if (!dateString) {
    return { success: false, message: "Date string is required to remove a holiday." };
  }

  try {
    const result = await removeHolidayFromService(dateString);
     if (result.success) {
        revalidatePath("/admin/holidays");
        revalidatePath("/availability"); // Also revalidate public availability page
        return { success: true, message: `Successfully removed holiday on ${dateString}.` };
    } else {
        return { success: false, message: result.error || "Failed to remove holiday." };
    }
  } catch (error) {
    console.error("Error in removeHolidayAction:", error);
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred.";
    return { success: false, message: errorMessage };
  }
}

    