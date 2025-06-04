
"use client";

import type { Booking } from "@/services/bookingService";
import React, { useTransition } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, CheckCircle, XCircle, Clock, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { updateBookingStatusAction } from "../actions";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea"; // For admin notes on cancellation


interface BookingsTableProps {
  bookings: Booking[];
  onBookingStatusChange: () => void; // Callback to refresh the list
}

export function BookingsTable({ bookings, onBookingStatusChange }: BookingsTableProps) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [pendingActionBookingId, setPendingActionBookingId] = React.useState<string | null>(null);
  const [cancellationNotes, setCancellationNotes] = React.useState<string>("");
  const [showCancelDialogFor, setShowCancelDialogFor] = React.useState<Booking | null>(null);


  const getStatusVariant = (status: Booking['status']) => {
    switch (status) {
      case 'pending':
        return 'default'; // Yellow-ish or neutral with HSL theme
      case 'confirmed':
        return 'secondary'; // Green-ish or success with HSL theme
      case 'cancelled':
        return 'destructive';
      default:
        return 'outline';
    }
  };
  
  const handleStatusUpdate = (bookingId: string, newStatus: Booking['status'], notes?: string) => {
    setPendingActionBookingId(bookingId);
    startTransition(async () => {
      const result = await updateBookingStatusAction(bookingId, newStatus, notes);
      if (result.success) {
        toast({
          title: "Status Updated",
          description: result.message,
        });
        onBookingStatusChange(); // Refresh the list
      } else {
        toast({
          title: "Error Updating Status",
          description: result.message,
          variant: "destructive",
        });
      }
      setPendingActionBookingId(null);
      if (newStatus === 'cancelled') {
        setShowCancelDialogFor(null);
        setCancellationNotes("");
      }
    });
  };

  const openCancelDialog = (booking: Booking) => {
    setShowCancelDialogFor(booking);
  };

  const performCancellation = () => {
    if (showCancelDialogFor) {
      handleStatusUpdate(showCancelDialogFor.id, 'cancelled', cancellationNotes || "Cancelled by admin.");
    }
  };


  return (
    <ScrollArea className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Contact Name</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Event Date</TableHead>
            <TableHead>Slot</TableHead>
            <TableHead>Event Type</TableHead>
            <TableHead className="text-right">Guests</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Requested On</TableHead>
            <TableHead className="text-center">Actions</TableHead> 
          </TableRow>
        </TableHeader>
        <TableBody>
          {bookings.map((booking) => (
            <TableRow key={booking.id}>
              <TableCell className="font-medium">
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <span>{booking.name}</span>
                        </TooltipTrigger>
                        {booking.message && (
                        <TooltipContent className="max-w-xs">
                            <p className="font-semibold">Message:</p>
                            <p className="text-sm whitespace-pre-wrap">{booking.message}</p>
                        </TooltipContent>
                        )}
                    </Tooltip>
                </TooltipProvider>
              </TableCell>
              <TableCell>{booking.phone}</TableCell>
              <TableCell>{format(booking.eventDate, "PPP")}</TableCell>
              <TableCell className="capitalize">{booking.eventSlot}</TableCell>
              <TableCell>{booking.eventType}</TableCell>
              <TableCell className="text-right">{booking.numberOfGuests}</TableCell>
              <TableCell>
                <Badge variant={getStatusVariant(booking.status)} className="capitalize">
                  {booking.status}
                </Badge>
              </TableCell>
              <TableCell>{format(booking.createdAt, "PPpp")} {booking.updatedAt && `(Updated: ${format(booking.updatedAt, "PPpp")})`}</TableCell>
              <TableCell className="text-center">
                {isPending && pendingActionBookingId === booking.id ? (
                    <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                ) : (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <span className="sr-only">Open menu</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {booking.status !== 'confirmed' && (
                      <DropdownMenuItem onClick={() => handleStatusUpdate(booking.id, 'confirmed')}>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Confirm
                      </DropdownMenuItem>
                    )}
                    {booking.status !== 'pending' && (
                      <DropdownMenuItem onClick={() => handleStatusUpdate(booking.id, 'pending')}>
                        <Clock className="mr-2 h-4 w-4" />
                        Mark as Pending
                      </DropdownMenuItem>
                    )}
                    {booking.status !== 'cancelled' && (
                       <DropdownMenuItem onClick={() => openCancelDialog(booking)} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                        <XCircle className="mr-2 h-4 w-4" />
                        Cancel Booking
                      </DropdownMenuItem>
                    )}
                    {booking.status === 'cancelled' && (
                        <DropdownMenuItem disabled>
                            No actions available
                        </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
       {showCancelDialogFor && (
        <AlertDialog open={!!showCancelDialogFor} onOpenChange={(open) => !open && setShowCancelDialogFor(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Cancel Booking for {showCancelDialogFor.name}?</AlertDialogTitle>
              <AlertDialogDescription>
                This will mark the booking for {showCancelDialogFor.eventType} on {format(showCancelDialogFor.eventDate, "PPP")} as cancelled. 
                The slot may become available. This action will be logged.
              </AlertDialogDescription>
            </AlertDialogHeader>
             <div className="space-y-2">
                <label htmlFor="cancellationNotes" className="text-sm font-medium">Reason / Notes (Optional)</label>
                <Textarea 
                    id="cancellationNotes"
                    value={cancellationNotes}
                    onChange={(e) => setCancellationNotes(e.target.value)}
                    placeholder="e.g., Client request, payment not received."
                    className="min-h-[80px]"
                />
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => { setShowCancelDialogFor(null); setCancellationNotes(""); }} disabled={isPending}>Back</AlertDialogCancel>
              <AlertDialogAction onClick={performCancellation} disabled={isPending} className="bg-destructive hover:bg-destructive/90">
                 {isPending && pendingActionBookingId === showCancelDialogFor.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Confirm Cancellation
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </ScrollArea>
  );
}
