"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import React, { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarIcon, Landmark, Users, DollarSign, ListChecks, Sparkles, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { generateEventFormat, type GenerateEventFormatInput, type GenerateEventFormatOutput } from "@/ai/flows/generate-event-format";

const aiPlannerFormSchema = z.object({
  venue: z.string().default("Treebon Resorts, Kollangana Kasargod Kerala"),
  date: z.date({ required_error: "Please select a date for the event." }),
  budget: z.string().min(1, { message: "Please enter an estimated budget (e.g., 50000 INR, Flexible)." }),
  numberOfGuests: z.coerce.number().min(1, { message: "Number of guests must be at least 1." }).max(1000, { message: "Max 1000 guests." }),
});

type AiPlannerFormValues = z.infer<typeof aiPlannerFormSchema>;

export function AiEventPlannerForm() {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [eventIdeas, setEventIdeas] = useState<string[] | null>(null);

  const form = useForm<AiPlannerFormValues>({
    resolver: zodResolver(aiPlannerFormSchema),
    defaultValues: {
      venue: "Treebon Resorts, Kollangana Kasargod Kerala",
      budget: "Flexible",
      numberOfGuests: 50,
    },
  });

  async function onSubmit(data: AiPlannerFormValues) {
    setEventIdeas(null);
    startTransition(async () => {
      try {
        const input: GenerateEventFormatInput = {
          ...data,
          date: format(data.date, "yyyy-MM-dd"), // Format date as string for AI
        };
        const result: GenerateEventFormatOutput = await generateEventFormat(input);
        if (result.eventFormatIdeas && result.eventFormatIdeas.length > 0) {
          setEventIdeas(result.eventFormatIdeas);
          toast({
            title: "Event Ideas Generated!",
            description: "Here are some creative ideas for your event.",
          });
        } else {
          setEventIdeas([]); // No ideas found
           toast({
            title: "No specific ideas found",
            description: "Try adjusting your criteria for more tailored suggestions.",
            variant: "default"
          });
        }
      } catch (error) {
        console.error("AI Event Planner Error:", error);
        toast({
          title: "Error Generating Ideas",
          description: "Could not generate event ideas. Please try again later.",
          variant: "destructive",
        });
      }
    });
  }

  return (
    <div className="space-y-8">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-headline text-primary flex items-center gap-2">
            <Sparkles className="h-7 w-7" />
            AI Event Format Generator
          </CardTitle>
          <CardDescription>
            Let our AI help you brainstorm creative event formats tailored to your needs. Fill in the details below to get started.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="venue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Venue</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Landmark className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input {...field} readOnly className="pl-10 bg-muted/50" />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Desired Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal justify-start",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                             disabled={(date) => date < new Date(new Date().setDate(new Date().getDate() -1)) }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="budget"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estimated Budget</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input placeholder="e.g., 1 Lakh INR or Flexible" {...field} className="pl-10" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="numberOfGuests"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Number of Guests</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input type="number" placeholder="e.g., 100" {...field} className="pl-10" />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full md:w-auto bg-accent hover:bg-accent/90 text-accent-foreground" disabled={isPending}>
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating Ideas...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate Event Ideas
                  </>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {isPending && (
        <Card className="shadow-lg mt-8">
          <CardContent className="p-6 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
            <p className="text-lg text-muted-foreground">Our AI is thinking... Please wait a moment.</p>
          </CardContent>
        </Card>
      )}

      {eventIdeas && eventIdeas.length > 0 && (
        <Card className="shadow-lg mt-8">
          <CardHeader>
            <CardTitle className="text-2xl font-headline text-primary flex items-center gap-2">
              <ListChecks className="h-7 w-7" />
              Suggested Event Ideas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-outside space-y-3 pl-5 text-foreground">
              {eventIdeas.map((idea, index) => (
                <li key={index} className="text-lg leading-relaxed bg-background p-3 rounded-md border border-border hover:bg-muted/50 transition-colors">
                  {idea}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
       {eventIdeas && eventIdeas.length === 0 && !isPending && (
        <Card className="shadow-lg mt-8">
          <CardContent className="p-6 text-center">
            <p className="text-lg text-muted-foreground">No specific event format ideas were generated based on your criteria. Please try different inputs.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
