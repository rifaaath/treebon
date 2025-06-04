
import { type NextRequest, NextResponse } from 'next/server';
import {
  getAvailabilityForDate,
  getBookingsForDate,
  updateBookingStatus,
  type Booking,
  type DailyAvailability,
} from '@/services/bookingService';
import { format, parseISO, isValid as isValidDate } from 'date-fns';

export const dynamic = 'force-dynamic';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_WEBHOOK_SECRET_TOKEN = process.env.TELEGRAM_WEBHOOK_SECRET_TOKEN;
const ADMIN_CHAT_IDS_STRING = process.env.ADMIN_TELEGRAM_CHAT_IDS;

let ADMIN_CHAT_IDS: number[] = [];
if (ADMIN_CHAT_IDS_STRING) {
  ADMIN_CHAT_IDS = ADMIN_CHAT_IDS_STRING.split(',').map(id => parseInt(id.trim(), 10)).filter(id => !isNaN(id));
  console.log("Authorized admin chat IDs:", ADMIN_CHAT_IDS);
} else {
  console.warn("ADMIN_TELEGRAM_CHAT_IDS is not set. No admin will be authorized.");
}


async function sendTelegramMessage(chatId: number, text: string) {
  if (!TELEGRAM_BOT_TOKEN) {
    console.error('Telegram bot token is not configured. Cannot send message.');
    return;
  }
  const TELEGRAM_API_URL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
  try {
    const response = await fetch(TELEGRAM_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: text, parse_mode: "Markdown" }),
    });
    const responseData = await response.json();
    if (!responseData.ok) {
      console.error('Failed to send Telegram message. Response from Telegram:', responseData);
    } else {
      console.log('Successfully sent Telegram reply to chat ID:', chatId);
    }
  } catch (error) {
    console.error('Error sending Telegram message via fetch:', error);
  }
}

function isAuthorizedAdmin(chatId: number): boolean {
  if (ADMIN_CHAT_IDS.length === 0) {
    console.warn("No admin chat IDs configured. Denying access for chat ID:", chatId);
    return false;
  }
  return ADMIN_CHAT_IDS.includes(chatId);
}

async function handleCommand(chatId: number, text: string): Promise<string> {
  const parts = text.trim().split(/\s+/);
  const command = parts[0].toLowerCase();
  const args = parts.slice(1);

  if (!isAuthorizedAdmin(chatId)) {
    return "Sorry, you are not authorized to use this bot.";
  }

  switch (command) {
    case '/help':
      return `Available commands:
        \`/help\` - Show this help message
        \`/availability YYYY-MM-DD\` - Check slot availability
        \`/bookings YYYY-MM-DD\` - List bookings for a date
        \`/confirm BOOKING_ID\` - Confirm a booking
        \`/cancel BOOKING_ID [Optional reason]\` - Cancel a booking
        \`/pending BOOKING_ID\` - Mark a booking as pending`;

    case '/availability':
      if (args.length < 1) return "Please provide a date. Usage: `/availability YYYY-MM-DD`";
      try {
        const targetDate = parseISO(args[0]);
        if (!isValidDate(targetDate)) return `Invalid date format: ${args[0]}. Please use YYYY-MM-DD.`;
        const availability: DailyAvailability = await getAvailabilityForDate(targetDate);
        const formattedDate = format(targetDate, "PPP");
        return `Availability for *${formattedDate}*:
          Morning: \`${availability.morning}\`
          Evening: \`${availability.evening}\``;
      } catch (e) {
        console.error("Error in /availability command:", e);
        return "Error fetching availability. Please check the date format.";
      }

    case '/bookings':
      if (args.length < 1) return "Please provide a date. Usage: `/bookings YYYY-MM-DD`";
      try {
        const targetDate = parseISO(args[0]);
        if (!isValidDate(targetDate)) return `Invalid date format: ${args[0]}. Please use YYYY-MM-DD.`;
        const bookings: Booking[] = await getBookingsForDate(targetDate);
        const formattedDate = format(targetDate, "PPP");
        if (bookings.length === 0) return `No bookings found for *${formattedDate}*.`;
        let response = `Bookings for *${formattedDate}* (${bookings.length}):\n`;
        bookings.forEach(b => {
          response += `  - ID: \`${b.id}\`, Name: ${b.name}, Slot: ${b.eventSlot}, Status: \`${b.status}\`, Guests: ${b.numberOfGuests}\n`;
        });
        return response;
      } catch (e) {
        console.error("Error in /bookings command:", e);
        return "Error fetching bookings. Please check the date format.";
      }

    case '/confirm':
    case '/cancel':
    case '/pending':
      if (args.length < 1) return `Please provide a booking ID. Usage: \`${command} BOOKING_ID [reason for cancel]\``;
      const bookingId = args[0];
      let newStatus: Booking['status'];
      if (command === '/confirm') newStatus = 'confirmed';
      else if (command === '/cancel') newStatus = 'cancelled';
      else newStatus = 'pending'; // for /pending

      const adminNotes = command === '/cancel' && args.length > 1 ? args.slice(1).join(" ") : undefined;

      try {
        const result = await updateBookingStatus(bookingId, newStatus, adminNotes, `telegram_admin_bot_user:${chatId}`);
        if (result.success) return `Booking \`${bookingId}\` status updated to \`${newStatus}\`. ${adminNotes ? "Notes: "+adminNotes : ""}`;
        return `Failed to update booking \`${bookingId}\`: ${result.error || 'Unknown error'}`;
      } catch (e) {
        console.error(`Error in ${command} command for ${bookingId}:`, e);
        return `Error updating booking ${bookingId}.`;
      }

    default:
      return "Unknown command. Type `/help` to see available commands.";
  }
}

export async function POST(request: NextRequest) {
  console.log('Telegram webhook received a request');

  const secretToken = request.headers.get('X-Telegram-Bot-Api-Secret-Token');
  if (TELEGRAM_WEBHOOK_SECRET_TOKEN) {
    if (secretToken !== TELEGRAM_WEBHOOK_SECRET_TOKEN) {
      console.error('Invalid Telegram secret token. Expected:', TELEGRAM_WEBHOOK_SECRET_TOKEN, 'Got:', secretToken);
      return new NextResponse('Unauthorized', { status: 401 });
    }
    console.log('Telegram secret token verified successfully.');
  } else {
    console.warn('TELEGRAM_WEBHOOK_SECRET_TOKEN is not set. Skipping secret token verification.');
  }

  try {
    const update = await request.json();
    console.log('Received Telegram update:', JSON.stringify(update, null, 2));

    if (update.message && update.message.text && update.message.chat && update.message.chat.id) {
      const messageText = update.message.text;
      const chatId = update.message.chat.id;

      console.log(`Processing message: "${messageText}" from chat ID: ${chatId}`);

      const replyText = await handleCommand(chatId, messageText);
      await sendTelegramMessage(chatId, replyText);

      return new NextResponse('OK', { status: 200 });
    } else {
      console.log('Received non-message update or message without text/chat ID, ignoring.');
      return new NextResponse('OK - Update not processed', { status: 200 });
    }
  } catch (error) {
    console.error('Error processing Telegram update in webhook:', error);
    // Attempt to notify admin if possible, or just log
    if (error instanceof Error && update && update.message && update.message.chat && update.message.chat.id) {
        await sendTelegramMessage(update.message.chat.id, `Sorry, an internal error occurred: ${error.message}`);
    }
    return new NextResponse('OK - Internal error processing update', { status: 200 });
  }
}

    