
"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BookingForm } from "@/components/booking-form";
import type { DailyAvailability } from "@/services/bookingService"; // Updated import
import { getAvailabilityForDate } from "@/services/bookingService"; // Updated import
import { format } from "date-fns";
import { CalendarCheck, Sunrise, Sunset, Loader2 } from "lucide-react";

export default function AvailabilityPage() {
  const [selectedDateState, setSelectedDateState] = useState<Date | undefined>(new Date());
  const [availability, setAvailability] = useState<DailyAvailability | null>(null);
  const [showBookingFormForSlot, setShowBookingFormForSlot] = useState<"morning" | "evening" | null>(null);
  const [isLoadingAvailability, setIsLoadingAvailability] = useState(false);
  const [disabledDates, setDisabledDates] = useState<(date: Date) => boolean>(() => () => false);


  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const fetchAndSetAvailability = useCallback(async (date: Date | undefined) => {
    if (!date) {
      setAvailability(null);
      setShowBookingFormForSlot(null);
      return;
    }
    setIsLoadingAvailability(true);
    try {
      const newAvailability = await getAvailabilityForDate(date);
      setAvailability(newAvailability);
      if (showBookingFormForSlot && newAvailability[showBookingFormForSlot] !== 'available') {
        setShowBookingFormForSlot(null);
      }
    } catch (error) {
      console.error("Failed to fetch availability:", error);
      // Optionally show a toast to the user
      setAvailability({ morning: 'available', evening: 'available' }); // Fallback
    } finally {
      setIsLoadingAvailability(false);
    }
  }, [showBookingFormForSlot]);

  useEffect(() => {
    fetchAndSetAvailability(selectedDateState);
  }, [selectedDateState, fetchAndSetAvailability]);
  
  // Function to determine if a day should be disabled in the calendar
  // This function will be passed to the Calendar component's `disabled` prop.
  // We fetch availability for each date to determine if it's fully booked.
  // This can be performance-intensive for large date ranges if not memoized
  // or if fetching is slow. For now, we'll disable past dates.
  // A more optimized approach for future dates might involve batch fetching
  // or pre-calculating disabled dates if possible.
  useEffect(() => {
    const isDayDisabled = (date: Date): boolean => {
      if (date < today) return true; // Past dates are disabled

      // For future dates, we'd ideally check Firestore.
      // However, calling getAvailabilityForDate for every single cell here
      // is not performant. A better approach for a production app would be to
      // fetch a range of disabled dates or mark them based on some logic.
      // For this iteration, we'll keep future dates enabled unless they are past.
      // The individual slot check will handle if specific slots are booked.
      return false; 
    };
    setDisabledDates(() => isDayDisabled);
  }, [today]);


  const handleDateSelect = (date?: Date) => {
    setSelectedDateState(date);
    // Availability will be fetched by the useEffect watching selectedDateState
  };

  const handleBookSlot = (slot: "morning" | "evening") => {
    if (selectedDateState && availability && availability[slot] === "available") {
      setShowBookingFormForSlot(slot);
      const formElement = document.getElementById("booking-form-section");
      if (formElement) {
        formElement.scrollIntoView({ behavior: "smooth" });
      }
    }
  };
  
  const formattedSelectedDate = useMemo(() => {
    return selectedDateState ? format(selectedDateState, "EEEE, MMMM do, yyyy") : "No date selected";
  }, [selectedDateState]);

  const SlotDisplay = ({ slot, Icon, label }: { slot: "morning" | "evening", Icon: React.ElementType, label: string }) => {
    if (isLoadingAvailability) {
      return (
        <Card className="text-center shadow-sm flex flex-col justify-center items-center h-[150px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground mt-2">Loading slot...</p>
        </Card>
      );
    }
    if (!availability || !selectedDateState) return <div className="p-4 bg-muted rounded-md text-center h-[150px] flex items-center justify-center">Select a date to see availability.</div>;
    
    const status = availability[slot];
    let statusText = "Available";
    let statusClass = "text-green-600";
    let buttonDisabled = false;

    if (selectedDateState < today || status === "booked" || status === "pending") {
       buttonDisabled = true;
       if (status === "booked") {
         statusText = "Booked";
         statusClass = "text-red-600";
       } else if (status === "pending") {
         statusText = "Pending Confirmation";
         statusClass = "text-yellow-600";
       } else if (selectedDateState < today) {
         statusText = "Past Date";
         statusClass = "text-muted-foreground";
       }
    }


    return (
      <Card className="text-center shadow-sm flex flex-col justify-between h-full">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-center gap-2 text-xl font-headline">
            <Icon className="h-6 w-6 text-primary" /> {label}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col flex-grow justify-between">
          <p className={`font-semibold text-lg ${statusClass} mb-3`}>{statusText}</p>
          <Button 
            onClick={() => handleBookSlot(slot)} 
            disabled={buttonDisabled || showBookingFormForSlot === slot}
            className="w-full bg-accent hover:bg-accent/90 text-accent-foreground disabled:opacity-50"
            aria-label={`Book ${label} slot`}
          >
            {showBookingFormForSlot === slot ? "Selected" : (buttonDisabled ? "Unavailable" : "Book This Slot")}
          </Button>
        </CardContent>
      </Card>
    );
  };


  return (
    <div className="space-y-12">
      <div className="text-center">
        <h1 className="text-4xl font-bold font-headline text-primary mb-4 flex items-center justify-center gap-3">
          <CalendarCheck className="h-10 w-10" />
          Check Availability & Book Your Event
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Select a date to see available morning and evening slots. Your selection will be confirmed via email or phone.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
        <Card className="md:col-span-1 shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline text-2xl text-primary">Select a Date</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <Calendar
              mode="single"
              selected={selectedDateState}
              onSelect={handleDateSelect}
              disabled={disabledDates}
              className="rounded-md border"
              initialFocus={!!selectedDateState}
            />
             <p className="text-sm text-muted-foreground mt-4">Past dates are disabled.</p>
          </CardContent>
        </Card>

        <div className="md:col-span-2 space-y-8">
          {selectedDateState && (
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="font-headline text-2xl text-primary">
                  Availability for <span className="text-accent">{formattedSelectedDate}</span>
                </CardTitle>
                <CardDescription>
                  Our venue offers two slots per day: Morning (approx. 9 AM - 3 PM) and Evening (approx. 5 PM - 11 PM).
                </CardDescription>
              </CardHeader>
              <CardContent className="grid sm:grid-cols-2 gap-6">
                <SlotDisplay slot="morning" Icon={Sunrise} label="Morning Slot" />
                <SlotDisplay slot="evening" Icon={Sunset} label="Evening Slot" />
              </CardContent>
            </Card>
          )}
         
          {showBookingFormForSlot && selectedDateState && (
            <div id="booking-form-section">
              <Card className="shadow-lg">
                  <CardHeader>
                      <CardTitle className="font-headline text-2xl text-primary">
                          Request Booking for {formattedSelectedDate} - {showBookingFormForSlot === "morning" ? "Morning" : "Evening"} Slot
                      </CardTitle>
                      <CardDescription>
                          Please fill in your details below. We will confirm your booking via email or phone.
                      </CardDescription>
                  </CardHeader>
                  <CardContent>
                      <BookingForm 
                        selectedDate={selectedDateState} 
                        selectedSlot={showBookingFormForSlot} 
                        onBookingSuccess={() => fetchAndSetAvailability(selectedDateState)} // Refresh availability on success
                      />
                  </CardContent>
              </Card>
            </div>
          )}
          {!showBookingFormForSlot && selectedDateState && (
             <Card className="shadow-lg bg-muted/50">
                <CardContent className="p-6 text-center">
                    <p className="text-lg text-muted-foreground">
                        {isLoadingAvailability ? <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" /> :
                         (availability && (availability?.morning === 'available' || availability?.evening === 'available'))
                         ? "Please select an available slot above to reveal the booking form."
                         : "No slots available for booking on this date. Please try another date."}
                    </p>
                </CardContent>
            </Card>
          )}
          {!selectedDateState && (
            <Card className="shadow-lg bg-muted/50">
                <CardContent className="p-6 text-center">
                    <p className="text-lg text-muted-foreground">Please select a date from the calendar to view availability.</p>
                </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
