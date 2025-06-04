
import { type NextRequest, NextResponse } from 'next/server';
import { processTelegramMessageFlow } from '@/ai/flows/telegram-admin-flow';

export const dynamic = 'force-dynamic'; // Ensures the route is always dynamically rendered

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_WEBHOOK_SECRET_TOKEN = process.env.TELEGRAM_WEBHOOK_SECRET_TOKEN;

async function sendTelegramMessage(chatId: number, text: string) {
  if (!TELEGRAM_BOT_TOKEN) {
    console.error('Telegram bot token is not configured. Cannot send message.');
    return;
  }
  const TELEGRAM_API_URL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
  try {
    const response = await fetch(TELEGRAM_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
      }),
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

export async function POST(request: NextRequest) {
  console.log('Telegram webhook received a request');

  // Verify secret token
  const secretToken = request.headers.get('X-Telegram-Bot-Api-Secret-Token');
  if (TELEGRAM_WEBHOOK_SECRET_TOKEN) {
    if (secretToken !== TELEGRAM_WEBHOOK_SECRET_TOKEN) {
      console.error('Invalid Telegram secret token received. Expected:', TELEGRAM_WEBHOOK_SECRET_TOKEN, 'Got:', secretToken);
      return new NextResponse('Unauthorized', { status: 401 });
    }
    console.log('Telegram secret token verified successfully.');
  } else {
    console.warn('TELEGRAM_WEBHOOK_SECRET_TOKEN is not set in environment. Skipping secret token verification. This is insecure for production.');
  }

  try {
    const update = await request.json();
    console.log('Received Telegram update:', JSON.stringify(update, null, 2));

    // Check if it's a message and has text and a chat ID
    if (update.message && update.message.text && update.message.chat && update.message.chat.id) {
      const messageText = update.message.text;
      const chatId = update.message.chat.id;

      console.log(`Processing message: "${messageText}" from chat ID: ${chatId}`);

      // Call the Genkit flow to process the message
      const flowResponse = await processTelegramMessageFlow({
        text: messageText,
        chatId: chatId,
      });

      console.log('Genkit flow generated reply:', flowResponse.reply);

      // Send the reply back to the user via Telegram API
      await sendTelegramMessage(chatId, flowResponse.reply);

      // Telegram expects a 200 OK response to acknowledge receipt of the update
      return new NextResponse('OK', { status: 200 });
    } else {
      console.log('Received non-message update or message without text/chat ID, ignoring.');
      // Still return 200 OK to Telegram to acknowledge receipt of other update types
      return new NextResponse('OK - Update not processed (not a text message)', { status: 200 });
    }

  } catch (error) {
    console.error('Error processing Telegram update in webhook:', error);
    // It's generally best to return 200 OK to Telegram quickly to prevent retries,
    // even if there's an internal error. The error is logged for debugging.
    return new NextResponse('OK - Internal error processing update', { status: 200 });
  }
}

