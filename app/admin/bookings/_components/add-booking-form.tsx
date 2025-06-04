
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import React, { useEffect, useActionState, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarIcon, User, Phone, Users, MessageCircle, ListChecks, Loader2, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { manualBookingFormSchema, type ManualBookingFormValues, type ManualAddBookingFormState } from "../schemas";
import { manualAddBookingAction, getSlotAvailabilityAction } from "../actions";
import type { DailyAvailability, SlotStatus } from "@/services/bookingService";


interface AddBookingFormProps {
  onBookingAdded: () => void;
}

const initialFormState: ManualAddBookingFormState = {
    success: false,
    message: "",
};

const getStatusColorClass = (status: SlotStatus | undefined): string => {
  if (!status) return "text-muted-foreground";
  switch (status) {
    case "available":
      return "text-green-600 font-semibold";
    case "pending":
      return "text-yellow-600 font-semibold";
    case "booked":
      return "text-red-600 font-semibold";
    default:
      return "text-muted-foreground";
  }
};

const capitalizeFirstLetter = (string: string) => {
  if (!string) return ''; // Guard against undefined or null
  return string.charAt(0).toUpperCase() + string.slice(1);
};


export function AddBookingForm({ onBookingAdded }: AddBookingFormProps) {
  const { toast } = useToast();
  const [formState, dispatchAddBooking, isActionPending] = useActionState(manualAddBookingAction, initialFormState);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  const [slotAvailability, setSlotAvailability] = useState<DailyAvailability | null>(null);
  const [isLoadingSlotAvailability, setIsLoadingSlotAvailability] = useState(false);

  const form = useForm<ManualBookingFormValues>({
    resolver: zodResolver(manualBookingFormSchema),
    defaultValues: {
      name: "",
      phone: "",
      eventDate: undefined, // Start with no date selected
      eventSlot: "morning",
      eventType: "",
      numberOfGuests: 50,
      message: "",
      status: "pending",
    },
  });

  const watchedEventDate = form.watch("eventDate");

  useEffect(() => {
    if (watchedEventDate) {
      const fetchAvailability = async () => {
        setIsLoadingSlotAvailability(true);
        setSlotAvailability(null); // Reset previous availability
        try {
          const availability = await getSlotAvailabilityAction(watchedEventDate);
          setSlotAvailability(availability);
        } catch (error) {
          console.error("Failed to fetch slot availability", error);
          setSlotAvailability(null);
          toast({
            title: "Error",
            description: "Could not fetch slot availability for the selected date.",
            variant: "destructive",
          });
        } finally {
          setIsLoadingSlotAvailability(false);
        }
      };
      fetchAvailability();
    } else {
      setSlotAvailability(null); // Clear availability if no date is selected
    }
  }, [watchedEventDate, toast]);


  useEffect(() => {
    // Only process if a message exists (meaning action has likely completed) AND action is no longer pending
    if (formState.message && !isActionPending) {
      if (formState.success) {
        toast({
          title: "Success!",
          description: formState.message,
        });
        form.reset({ // Reset form to initial defaults or specific values
             name: "",
            phone: "",
            eventDate: undefined,
            eventSlot: "morning",
            eventType: "",
            numberOfGuests: 50,
            message: "",
            status: "pending",
        });
        setSlotAvailability(null); // Clear availability display
        onBookingAdded(); // This closes the dialog
      } else {
        toast({
          title: "Error Adding Booking",
          description: formState.message || "An unexpected error occurred. Please check the details and try again.",
          variant: "destructive",
        });
      }
    }
  }, [formState, toast, form, onBookingAdded, isActionPending]);


  const onSubmit = (data: ManualBookingFormValues) => {
    if (!data.eventDate) {
        toast({ title: "Error", description: "Event date is required.", variant: "destructive" });
        return;
    }
    const formData = new FormData();
    formData.append("name", data.name);
    formData.append("phone", data.phone);
    formData.append("eventDate", data.eventDate.toISOString());
    formData.append("eventSlot", data.eventSlot);
    formData.append("eventType", data.eventType);
    formData.append("numberOfGuests", data.numberOfGuests.toString());
    formData.append("message", data.message || "");
    formData.append("status", data.status);

    dispatchAddBooking(formData);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name</FormLabel>
                <FormControl>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="e.g. Jane Doe" {...field} className="pl-10" />
                  </div>
                </FormControl>
                <FormMessage>{formState.errors?.name?.[0]}</FormMessage>
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
                <FormMessage>{formState.errors?.phone?.[0]}</FormMessage>
              </FormItem>
            )}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
            <FormField
                control={form.control}
                name="eventDate"
                render={({ field }) => (
                    <FormItem className="flex flex-col">
                    <FormLabel>Event Date</FormLabel>
                    <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
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
                        <PopoverContent
                            className="w-auto p-0"
                            align="start"
                        >
                        <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={(date) => {
                                field.onChange(date);
                                setIsDatePickerOpen(false); // Close popover on date select
                            }}
                            disabled={(date) => {
                                const today = new Date();
                                today.setHours(0, 0, 0, 0);
                                return date < today;
                            }}
                        />
                        </PopoverContent>
                    </Popover>
                    <FormMessage>{formState.errors?.eventDate?.[0]}</FormMessage>
                    </FormItem>
                )}
            />
            <FormField
              control={form.control}
              name="eventSlot"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Event Slot</FormLabel>
                   {isLoadingSlotAvailability && form.getValues("eventDate") && (
                     <p className="text-xs text-muted-foreground mt-1">Loading slot availability...</p>
                   )}
                  {slotAvailability && form.getValues("eventDate") && !isLoadingSlotAvailability && (
                    <FormDescription className="text-xs">
                      Morning: <span className={getStatusColorClass(slotAvailability.morning)}>{capitalizeFirstLetter(slotAvailability.morning)}</span>
                      , Evening: <span className={getStatusColorClass(slotAvailability.evening)}>{capitalizeFirstLetter(slotAvailability.evening)}</span>
                    </FormDescription>
                  )}
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={!watchedEventDate || isLoadingSlotAvailability}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a slot" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="morning">Morning</SelectItem>
                      <SelectItem value="evening">Evening</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage>{formState.errors?.eventSlot?.[0]}</FormMessage>
                </FormItem>
              )}
            />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
                control={form.control}
                name="eventType"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Type of Event</FormLabel>
                    <FormControl>
                    <Input placeholder="e.g. Wedding, Birthday" {...field} />
                    </FormControl>
                    <FormMessage>{formState.errors?.eventType?.[0]}</FormMessage>
                </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="numberOfGuests"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Number of Guests</FormLabel>
                    <FormControl>
                    <div className="relative">
                        <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="number"
                            placeholder="e.g. 150"
                            {...field}
                            className="pl-10"
                            onChange={e => field.onChange(parseInt(e.target.value,10) || 0)}
                         />
                    </div>
                    </FormControl>
                    <FormMessage>{formState.errors?.numberOfGuests?.[0]}</FormMessage>
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
                      placeholder="Any specific requirements or notes."
                      className="resize-none pl-10"
                      {...field}
                      rows={3}
                    />
                  </div>
                </FormControl>
                <FormMessage>{formState.errors?.message?.[0]}</FormMessage>
              </FormItem>
            )}
        />
        <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
            <FormItem>
                <FormLabel>Booking Status</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                    <SelectTrigger>
                    <ListChecks className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <span className="pl-6"><SelectValue placeholder="Select status" /></span>
                    </SelectTrigger>
                </FormControl>
                <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                </SelectContent>
                </Select>
                <FormMessage>{formState.errors?.status?.[0]}</FormMessage>
            </FormItem>
            )}
        />
        {formState.errors?._form && !isActionPending && (
            <FormDescription className="text-destructive">
                {formState.errors._form.join(", ")}
            </FormDescription>
        )}
        <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground" disabled={isActionPending || !watchedEventDate}>
          {isActionPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving Booking...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" /> Save Booking
            </>
          )}
        </Button>
      </form>
    </Form>
  );
}

