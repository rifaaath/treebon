
import { config } from 'dotenv';
config(); // Load .env variables

// Register your Genkit flows here
import '@/ai/flows/generate-event-format.ts';
import '@/ai/flows/telegram-admin-flow.ts'; // Changed from whatsapp-admin-flow
