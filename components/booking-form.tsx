
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import React from "react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { User, Phone, Users, MessageCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { submitBooking } from "@/app/availability/actions";

const bookingFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  phone: z.string().min(10, { message: "Phone number must be at least 10 digits." }).regex(/^\+?[0-9\s-()]+$/, "Invalid phone number format."),
  eventDate: z.date({ required_error: "Event date is required." }), 
  eventSlot: z.enum(["morning", "evening"], { required_error: "Event slot is required." }), 
  eventType: z.string().min(3, { message: "Event type must be at least 3 characters." }),
  numberOfGuests: z.coerce.number().min(1, { message: "Number of guests must be at least 1." }).max(1000, {message: "Maximum 1000 guests."}),
  message: z.string().optional(),
});

export type BookingFormValues = z.infer<typeof bookingFormSchema>;

interface BookingFormProps {
  selectedDate: Date; 
  selectedSlot: "morning" | "evening";
  onBookingSuccess?: () => void; // Optional callback
}

export function BookingForm({ selectedDate, selectedSlot, onBookingSuccess }: BookingFormProps) {
  const { toast } = useToast();
  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: {
      name: "",
      phone: "",
      eventDate: selectedDate, 
      eventSlot: selectedSlot, 
      eventType: "",
      numberOfGuests: 50,
      message: "",
    },
    mode: "onChange",
  });

  React.useEffect(() => {
    form.setValue("eventDate", selectedDate, { shouldValidate: true });
    form.setValue("eventSlot", selectedSlot, { shouldValidate: true });
  }, [selectedDate, selectedSlot, form]);


  async function onSubmit(data: BookingFormValues) {
    try {
      const result = await submitBooking(data);
      if (result.success) {
        toast({
          title: "Booking Request Sent!",
          description: "Thank you for your request. We will contact you shortly to confirm.",
        });
        form.reset({
            name: "",
            phone: "",
            eventDate: selectedDate, 
            eventSlot: selectedSlot, 
            eventType: "",
            numberOfGuests: 50,
            message: "",
        });
        if (onBookingSuccess) {
          onBookingSuccess(); // Call the callback to refresh availability
        }
      } else {
        toast({
          title: "Error",
          description: result.error || "Could not send booking request. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Submission Error",
        description: "An unexpected error occurred. Please try again later.",
        variant: "destructive",
      });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 p-6 border rounded-lg shadow-lg bg-card">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name</FormLabel>
                <FormControl>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="e.g. John Doe" {...field} className="pl-10" />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone Number</FormLabel>
                <FormControl>
                   <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input type="tel" placeholder="e.g. +91 98765 43210" {...field} className="pl-10" />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="eventType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Type of Event</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. Wedding, Birthday, Corporate Meeting" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="numberOfGuests"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>Estimated Number of Guests</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input type="number" placeholder="e.g. 150" {...field} className="pl-10" />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
            control={form.control}
            name="message"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Additional Message (Optional)</FormLabel>
                <FormControl>
                  <div className="relative">
                    <MessageCircle className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Textarea
                      placeholder="Tell us anything else, like specific requirements or questions."
                      className="resize-none pl-10"
                      {...field}
                      rows={4}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        <Button type="submit" className="w-full md:w-auto bg-accent hover:bg-accent/90 text-accent-foreground" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Sending Request..." : "Send Booking Request"}
        </Button>
      </form>
    </Form>
  );
}
