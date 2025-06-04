
'use server';
/**
 * @fileOverview Telegram Admin Bot AI Agent.
 * This flow processes incoming Telegram messages, interprets admin commands,
 * and interacts with booking services.
 *
 * - processTelegramMessageFlow - Handles message processing.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {
  getAvailabilityForDate,
  getBookingsForDate,
  updateBookingStatus,
  type Booking,
  type DailyAvailability,
} from '@/services/bookingService';
import {format, parseISO, isValid as isValidDate, addDays, nextMonday as getNextMonday, nextTuesday as getNextTuesday, nextWednesday as getNextWednesday, nextThursday as getNextThursday, nextFriday as getNextFriday, nextSaturday as getNextSaturday, nextSunday as getNextSunday, startOfToday} from 'date-fns';

// Schemas (internal to this module now)
const TelegramMessageInputSchema = z.object({
  text: z.string().describe('The text message from the Telegram user.'),
  chatId: z.number().describe('The chat ID to send the reply to.'),
});
type TelegramMessageInput = z.infer<typeof TelegramMessageInputSchema>;

const TelegramAdminResponseSchema = z.object({
  reply: z.string().describe('The text message to send back to the Telegram user.'),
});
type TelegramAdminResponse = z.infer<typeof TelegramAdminResponseSchema>;

// --- Tools for the Admin Bot ---

// 1. Get Availability Tool
const GetAvailabilityInputSchema = z.object({
  date: z.string().describe('The date to check availability for, in yyyy-MM-dd format. If a common name like "tomorrow" or "next Monday" is used, convert it to yyyy-MM-dd based on the current date.'),
});
const GetAvailabilityOutputSchema = z.object({
  date: z.string(),
  morning: z.string().describe("Status of the morning slot: 'available', 'pending', or 'booked'."),
  evening: z.string().describe("Status of the evening slot: 'available', 'pending', or 'booked'."),
  message: z.string().optional().describe("A human-readable summary of the availability. This should be relayed to the user."),
});

const getAvailabilityTool = ai.defineTool(
  {
    name: 'getAvailabilityTool',
    description: 'Checks the availability of morning and evening slots for a specific date. Converts relative dates (e.g., "tomorrow", "today", "next Monday") to absolute yyyy-MM-dd dates before checking.',
    inputSchema: GetAvailabilityInputSchema,
    outputSchema: GetAvailabilityOutputSchema,
  },
  async (input) => {
    try {
      const targetDate = parseISO(input.date);
      if (!isValidDate(targetDate)) {
        return { date: input.date, morning: 'error', evening: 'error', message: `Invalid date format: ${input.date}. Please use yyyy-MM-dd.` };
      }
      const availability: DailyAvailability = await getAvailabilityForDate(targetDate);
      const formattedDate = format(targetDate, "PPP"); // e.g., "Jul 22nd, 2024"
      let message = `Availability for ${formattedDate}:\nMorning: ${availability.morning}\nEvening: ${availability.evening}`;
      if (availability.morning === 'booked' && availability.evening === 'booked') {
        message += "\nThis date appears to be fully booked or might be a holiday.";
      }
      return {
        date: input.date,
        morning: availability.morning,
        evening: availability.evening,
        message: message,
      };
    } catch (error) {
      console.error('Error in getAvailabilityTool for date', input.date, ':', error);
      return {
        date: input.date,
        morning: 'error',
        evening: 'error',
        message: `Sorry, I encountered an error fetching availability for ${input.date}. The system reported: ${error instanceof Error ? error.message : 'Unknown error'}.`,
      };
    }
  }
);

// 2. Get Bookings for Date Tool
const GetBookingsInputSchema = z.object({
  date: z.string().describe('The date to fetch bookings for, in yyyy-MM-dd format. Convert relative dates like "today" to yyyy-MM-dd.'),
});
const BookingSummarySchema = z.object({
  id: z.string(),
  name: z.string(),
  eventSlot: z.string(),
  eventType: z.string(),
  status: z.string(),
  numberOfGuests: z.number(),
});
const GetBookingsOutputSchema = z.object({
  date: z.string(),
  bookings: z.array(BookingSummarySchema).describe('A list of booking summaries for the given date.'),
  count: z.number().describe('Total number of bookings found for the date.'),
  message: z.string().optional().describe("A human-readable summary of the bookings or a message if none are found. This should be relayed to the user."),
});

const getBookingsForDateTool = ai.defineTool(
  {
    name: 'getBookingsForDateTool',
    description: 'Fetches all bookings for a specific date, providing a summary for each. Converts relative dates to yyyy-MM-dd.',
    inputSchema: GetBookingsInputSchema,
    outputSchema: GetBookingsOutputSchema,
  },
  async (input) => {
    try {
      const targetDate = parseISO(input.date);
       if (!isValidDate(targetDate)) {
        return { date: input.date, bookings:[], count: 0, message: `Invalid date format: ${input.date}. Please use yyyy-MM-dd.` };
      }
      const bookings: Booking[] = await getBookingsForDate(targetDate);
      const formattedDate = format(targetDate, "PPP");
      let message: string;
      if (bookings.length === 0) {
        message = `No bookings found for ${formattedDate}.`;
      } else {
        message = `Found ${bookings.length} booking(s) for ${formattedDate}:\n` +
                  bookings.map(b => `- ID: ${b.id}, Name: ${b.name}, Slot: ${b.eventSlot}, Status: ${b.status}, Guests: ${b.numberOfGuests}`).join('\n');
      }
      return {
        date: input.date,
        bookings: bookings.map(b => ({
          id: b.id,
          name: b.name,
          eventSlot: b.eventSlot,
          eventType: b.eventType,
          status: b.status,
          numberOfGuests: b.numberOfGuests,
        })),
        count: bookings.length,
        message: message,
      };
    } catch (error) {
      console.error('Error in getBookingsForDateTool for date', input.date, ':', error);
      return {
        date: input.date,
        bookings: [],
        count: 0,
        message: `Sorry, I encountered an error fetching bookings for ${input.date}. The system reported: ${error instanceof Error ? error.message : 'Unknown error'}.`,
      };
    }
  }
);

// 3. Update Booking Status Tool
const UpdateBookingStatusInputSchema = z.object({
  bookingId: z.string().describe('The ID of the booking to update. This should be an exact ID obtained from a previous query or known by the admin.'),
  newStatus: z.enum(['pending', 'confirmed', 'cancelled']).describe('The new status for the booking.'),
  adminNotes: z.string().optional().describe('Optional notes from the admin for this status change (e.g., reason for cancellation).'),
});
const UpdateBookingStatusOutputSchema = z.object({
  bookingId: z.string(),
  success: z.boolean(),
  message: z.string().describe('A confirmation or error message regarding the status update. This should be relayed to the user.'),
});

const updateBookingStatusTool = ai.defineTool(
  {
    name: 'updateBookingStatusTool',
    description: "Updates the status of a specific booking using its ID (e.g., to 'confirmed', 'cancelled', or 'pending'). Admin notes can be provided.",
    inputSchema: UpdateBookingStatusInputSchema,
    outputSchema: UpdateBookingStatusOutputSchema,
  },
  async (input) => {
    try {
      // For Telegram, we might not have a specific admin user ID from the context easily,
      // so using a generic identifier or enhancing this later.
      const result = await updateBookingStatus(input.bookingId, input.newStatus, input.adminNotes, `telegram_admin_bot`);
      return {
        bookingId: input.bookingId,
        success: result.success,
        message: result.success ? `Booking ${input.bookingId} status successfully updated to ${input.newStatus}.` : (result.error || `Failed to update booking ${input.bookingId} status.`),
      };
    } catch (error) {
      console.error('Error in updateBookingStatusTool for booking ID', input.bookingId, ':', error);
      return {
        bookingId: input.bookingId,
        success: false,
        message: `Sorry, I encountered an error updating booking ${input.bookingId}. The system reported: ${error instanceof Error ? error.message : 'Unknown error'}.`,
      };
    }
  }
);

// Main Prompt for the Admin Bot
const telegramAdminPrompt = ai.definePrompt({
  name: 'telegramAdminPrompt',
  input: {schema: TelegramMessageInputSchema},
  output: {schema: TelegramAdminResponseSchema},
  tools: [getAvailabilityTool, getBookingsForDateTool, updateBookingStatusTool],
  prompt: `You are an AI assistant for Treebon Resorts admins, communicating via Telegram.
Your primary role is to help admins manage bookings and check resort availability.
The current date is ${format(new Date(), 'yyyy-MM-dd')}.

Tool Usage Guidelines:
- When asked about availability (e.g., "Is tomorrow free?", "Availability for 2024-12-25"), use the 'getAvailabilityTool'. You MUST convert any relative dates like "tomorrow", "next Monday", "today" into an absolute 'yyyy-MM-dd' format before calling the tool. For example, if today is 2024-07-21, "tomorrow" becomes "2024-07-22", and "next Monday" becomes "2024-07-29".
- When asked to list bookings for a date (e.g., "Show bookings for next Friday", "Any bookings on 2024-11-10?"), use the 'getBookingsForDateTool'. Again, convert relative dates to 'yyyy-MM-dd'.
- When asked to update a booking's status (e.g., "Confirm booking 123xyz", "Cancel booking abc987 reason: client request", "Mark booking foo123 as pending"), use the 'updateBookingStatusTool'. You need an exact booking ID and the new status ('pending', 'confirmed', 'cancelled'). If notes are provided, include them.

Interaction Style:
- If a date is mentioned, try to parse it to 'yyyy-MM-dd'. If you cannot confidently parse a date or if it's ambiguous, ask for clarification in 'yyyy-MM-dd' format.
- If a booking ID for an update is missing or unclear, ask the admin to provide the exact booking ID.
- Respond concisely and professionally.
- After a tool is used, ALWAYS use the 'message' property from the tool's output as the basis for your reply. For example, if getAvailabilityTool returns a message property like "Availability for Jul 23rd, 2024: Morning: available Evening: booked", your reply should directly use or accurately summarize this message. If a tool indicates an error in its message property, relay that error clearly.
- If an action is successful, confirm it using the tool's message. If there's an error reported by the tool, state the error message from the tool's message property.
- Do not make up information. Only use the provided tools. If you cannot fulfill a request with the tools, say so clearly (e.g., "I can only check availability, list bookings, or update booking statuses. For other requests, please use the admin panel.").
- If converting relative dates like "today", "tomorrow", "next Monday/Tuesday/etc.":
    - "today" is ${format(startOfToday(), 'yyyy-MM-dd')}
    - "tomorrow" is ${format(addDays(startOfToday(), 1), 'yyyy-MM-dd')}
    - "next Monday" is ${format(getNextMonday(startOfToday()), 'yyyy-MM-dd')}
    - "next Tuesday" is ${format(getNextTuesday(startOfToday()), 'yyyy-MM-dd')}
    - "next Wednesday" is ${format(getNextWednesday(startOfToday()), 'yyyy-MM-dd')}
    - "next Thursday" is ${format(getNextThursday(startOfToday()), 'yyyy-MM-dd')}
    - "next Friday" is ${format(getNextFriday(startOfToday()), 'yyyy-MM-dd')}
    - "next Saturday" is ${format(getNextSaturday(startOfToday()), 'yyyy-MM-dd')}
    - "next Sunday" is ${format(getNextSunday(startOfToday()), 'yyyy-MM-dd')}
    (adjust similarly for other days of the week, e.g., "next Tuesday", "next Wednesday" and so on, calculating from today which is ${format(startOfToday(), 'yyyy-MM-dd')})

User message: {{{text}}}
Chat ID: {{{chatId}}}
`,
});

// The Flow
export async function processTelegramMessageFlow(input: TelegramMessageInput): Promise<TelegramAdminResponse> {
  console.log('Processing Telegram message in flow:', input.text, 'for chat ID:', input.chatId);
  try {
    const {output} = await telegramAdminPrompt(input);

    if (!output || !output.reply) {
      console.error('LLM output or reply was null/undefined from telegramAdminPrompt. This might indicate an issue with the prompt or tool result processing by the LLM. Input was:', input);
      return { reply: "I'm sorry, I couldn't fully process your request or generate a suitable reply from the AI. Please try rephrasing or be more specific." };
    }
    console.log('LLM generated reply for chat ID', input.chatId, ':', output.reply);
    return { reply: output.reply };

  } catch (error: any) {
      console.error('Error in processTelegramMessageFlow for chat ID', input.chatId, ':', error);
      let errorMessage = "I encountered an unexpected issue processing your request. Please try again.";
      if (error instanceof Error) {
          if (error.message.includes("blocked by the safety filter")) {
            errorMessage = "Your request could not be processed due to safety settings. Please rephrase your request.";
          } else if (error.message.includes("Failed to parse") || error.message.includes("parse error") || error.message.includes("Invalid JSON")) {
            errorMessage = "There was an issue with interpreting results from an internal tool or understanding the input. Please check your input or try again.";
          } else if (error.message.includes("deadline exceeded") || error.message.includes("timeout")) {
            errorMessage = "The request took too long to process. Please try again shortly."
          } else if (error.message.includes("No valid candidate") || error.message.includes("model did not provide a candidate")) {
             errorMessage = "I'm sorry, I couldn't find a suitable answer or action for your request with the AI. Please try rephrasing."
          } else {
            errorMessage = `An error occurred: ${error.message}. Please try again.`
          }
      } else if (typeof error === 'string' && error.includes("blocked by the safety filter")) {
         errorMessage = "Your request could not be processed due to safety settings. Please rephrase your request.";
      }
      return { reply: errorMessage };
  }
}

