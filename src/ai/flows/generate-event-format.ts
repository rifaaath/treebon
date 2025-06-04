'use server';

/**
 * @fileOverview Event format generation AI agent.
 *
 * - generateEventFormat - A function that handles the event format generation process.
 * - GenerateEventFormatInput - The input type for the generateEventFormat function.
 * - GenerateEventFormatOutput - The return type for the generateEventFormat function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateEventFormatInputSchema = z.object({
  venue: z.string().describe('The venue at Treebon Resorts.'),
  date: z.string().describe('The desired date for the event.'),
  budget: z.string().describe('The budget for the event.'),
  numberOfGuests: z.number().describe('The number of guests attending the event.'),
});

export type GenerateEventFormatInput = z.infer<typeof GenerateEventFormatInputSchema>;

const GenerateEventFormatOutputSchema = z.object({
  eventFormatIdeas: z.array(z.string()).describe('A list of event format ideas.'),
});

export type GenerateEventFormatOutput = z.infer<typeof GenerateEventFormatOutputSchema>;

export async function generateEventFormat(input: GenerateEventFormatInput): Promise<GenerateEventFormatOutput> {
  return generateEventFormatFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateEventFormatPrompt',
  input: {schema: GenerateEventFormatInputSchema},
  output: {schema: GenerateEventFormatOutputSchema},
  prompt: `You are an event planning assistant for Treebon Resorts.

  Generate a few event format ideas based on the following criteria:

  Venue: {{{venue}}}
  Date: {{{date}}}
  Budget: {{{budget}}}
  Number of Guests: {{{numberOfGuests}}}

  Provide a diverse range of ideas that are feasible and attractive to potential clients.
  Format the output as a numbered list of event ideas.
  Each idea should be concise and engaging.
  `,
});

const generateEventFormatFlow = ai.defineFlow(
  {
    name: 'generateEventFormatFlow',
    inputSchema: GenerateEventFormatInputSchema,
    outputSchema: GenerateEventFormatOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
