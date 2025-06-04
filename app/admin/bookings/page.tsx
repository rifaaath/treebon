
"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { getAllBookings, type Booking } from "@/services/bookingService";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookMarked, PlusCircle, Loader2, Filter, XCircle } from "lucide-react";
import { BookingsTable } from "./_components/bookings-table";
import { AddBookingForm } from "./_components/add-booking-form";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";


// Helper function to check if two dates are on the same day (ignoring time)
const isSameDay = (date1: Date, date2: Date): boolean => {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
};


export default function ManageBookingsPage() {
  const [allBookings, setAllBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddBookingDialogOpen, setIsAddBookingDialogOpen] = useState(false);
  const [triggerFetch, setTriggerFetch] = useState(0); // Used to trigger re-fetch
  const [selectedFilterDate, setSelectedFilterDate] = useState<Date | undefined>(undefined);
  const [isFilterDatePickerOpen, setIsFilterDatePickerOpen] = useState(false);


  const fetchBookingsData = useCallback(async () => {
    setIsLoading(true);
    try {
      const fetchedBookings = await getAllBookings();
      setAllBookings(fetchedBookings);
    } catch (error) {
      console.error("Failed to fetch bookings:", error);
      // Optionally, set an error state or show a toast
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBookingsData();
  }, [triggerFetch, fetchBookingsData]);

  const handleBookingAddedOrStatusChanged = useCallback(() => {
    setIsAddBookingDialogOpen(false); // Close dialog if it was for adding
    setTriggerFetch(prev => prev + 1); // Trigger re-fetch
  }, []);

  const displayedBookings = useMemo(() => {
    if (!selectedFilterDate) {
      return allBookings;
    }
    return allBookings.filter(booking => isSameDay(booking.eventDate, selectedFilterDate));
  }, [allBookings, selectedFilterDate]);

  return (
    <div className="space-y-8">
      <Card className="shadow-lg">
        <CardHeader className="flex flex-col md:flex-row justify-between md:items-center gap-4">
          <div>
            <CardTitle className="text-2xl font-headline text-primary flex items-center gap-2">
              <BookMarked className="h-7 w-7" />
              Manage Bookings
            </CardTitle>
            <CardDescription>
              View all event booking requests, manually add new bookings, and update their status.
            </CardDescription>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 items-center">
             <Popover open={isFilterDatePickerOpen} onOpenChange={setIsFilterDatePickerOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full sm:w-auto">
                  <Filter className="mr-2 h-4 w-4" />
                  {selectedFilterDate ? format(selectedFilterDate, "PPP") : "Filter by Date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="single"
                  selected={selectedFilterDate}
                  onSelect={(date) => {
                    setSelectedFilterDate(date);
                    setIsFilterDatePickerOpen(false);
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            {selectedFilterDate && (
              <Button variant="ghost" size="icon" onClick={() => setSelectedFilterDate(undefined)} aria-label="Clear date filter">
                <XCircle className="h-5 w-5 text-destructive" />
              </Button>
            )}
            <Dialog open={isAddBookingDialogOpen} onOpenChange={setIsAddBookingDialogOpen}>
                <DialogTrigger asChild>
                <Button className="bg-accent hover:bg-accent/90 text-accent-foreground w-full sm:w-auto">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add New Booking
                </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[625px]">
                <DialogHeader>
                    <DialogTitle className="font-headline text-2xl text-primary">Add New Booking Manually</DialogTitle>
                    <DialogDescription>
                    Fill in the details below to add a booking that came through other channels (e.g., phone call).
                    </DialogDescription>
                </DialogHeader>
                <AddBookingForm onBookingAdded={handleBookingAddedOrStatusChanged} />
                </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
             <div className="flex justify-center items-center h-40">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="ml-2 text-muted-foreground">Loading bookings...</p>
            </div>
          ) : displayedBookings.length === 0 ? (
            <p className="text-muted-foreground text-center py-10">
                {selectedFilterDate ? `No bookings found for ${format(selectedFilterDate, "PPP")}.` : "No booking requests found."}
            </p>
          ) : (
            <BookingsTable bookings={displayedBookings} onBookingStatusChange={handleBookingAddedOrStatusChanged} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
