
"use client";

import React, { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Trash2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { removeHolidayAction } from "../actions";
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

interface RemoveHolidayButtonProps {
  holidayId: string; // This is the dateString YYYY-MM-DD
  holidayName: string;
}

export function RemoveHolidayButton({ holidayId, holidayName }: RemoveHolidayButtonProps) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const handleRemove = async () => {
    startTransition(async () => {
      const result = await removeHolidayAction(holidayId);
      if (result.success) {
        toast({
          title: "Holiday Removed",
          description: result.message,
        });
      } else {
        toast({
          title: "Error Removing Holiday",
          description: result.message,
          variant: "destructive",
        });
      }
    });
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="icon" disabled={isPending} aria-label={`Remove ${holidayName}`}>
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action will remove the holiday &quot;{holidayName}&quot; on {holidayId}. This cannot be undone.
            The date will become available for booking unless other restrictions apply.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleRemove} disabled={isPending} className="bg-destructive hover:bg-destructive/90">
            {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Remove Holiday
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

    