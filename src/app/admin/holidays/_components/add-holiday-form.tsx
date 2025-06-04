
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import React, { useEffect, useTransition, useActionState } from "react";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarIcon, PlusCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { addHolidayAction, type AddHolidayFormState } from "../actions";

const addHolidayFormSchema = z.object({
  holidayName: z.string().min(2, { message: "Holiday name must be at least 2 characters." }),
  holidayDate: z.date({ required_error: "Please select a date for the holiday." }),
});

type AddHolidayFormValues = z.infer<typeof addHolidayFormSchema>;

const initialFormState: AddHolidayFormState = {
    success: false,
    message: "",
};

export function AddHolidayForm() {
  const { toast } = useToast();
  const [formState, dispatchAddHoliday, isActionPending] = useActionState(addHolidayAction, initialFormState);
  
  const form = useForm<AddHolidayFormValues>({
    resolver: zodResolver(addHolidayFormSchema),
    defaultValues: {
      holidayName: "",
      holidayDate: undefined,
    },
  });

  useEffect(() => {
    if (formState.message && !isActionPending) { 
      if (formState.success) {
        toast({
          title: "Success!",
          description: formState.message,
        });
        form.reset(); 
      } else {
        toast({
          title: "Error",
          description: formState.message,
          variant: "destructive",
        });
      }
    }
  }, [formState, toast, form, isActionPending]);


  const onSubmit = (data: AddHolidayFormValues) => {
    const formData = new FormData();
    formData.append("holidayName", data.holidayName);
    if (data.holidayDate) {
      formData.append("holidayDate", data.holidayDate.toISOString());
    }
    // When using useActionState, you don't need to wrap dispatch in startTransition manually
    // as useActionState handles the pending state.
    // The third value returned by useActionState IS the pending state.
    dispatchAddHoliday(formData);
  };


  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="holidayName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Holiday Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Christmas Day" {...field} />
              </FormControl>
              <FormMessage>{formState.errors?.holidayName?.[0]}</FormMessage>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="holidayDate"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Holiday Date</FormLabel>
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
                    disabled={(date) => date < new Date(new Date().setDate(new Date().getDate() -1))} 
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormMessage>{formState.errors?.holidayDate?.[0]}</FormMessage>
            </FormItem>
          )}
        />
         {formState.errors?._form && !isActionPending && ( 
            <FormDescription className="text-destructive">
                {formState.errors._form.join(", ")}
            </FormDescription>
        )}
        <Button type="submit" className="bg-accent hover:bg-accent/90 text-accent-foreground" disabled={isActionPending}>
          {isActionPending ? ( 
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Adding...
            </>
          ) : (
            <>
              <PlusCircle className="mr-2 h-4 w-4" /> Add Holiday
            </>
          )}
        </Button>
      </form>
    </Form>
  );
}
