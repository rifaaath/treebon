
import { getAllHolidays, type Holiday } from "@/services/bookingService";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarDays, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { AddHolidayForm } from "./_components/add-holiday-form";
import { RemoveHolidayButton } from "./_components/remove-holiday-button";

export default async function ManageHolidaysPage() {
  const holidays = await getAllHolidays();

  return (
    <div className="space-y-8">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-headline text-primary flex items-center gap-2">
            <CalendarDays className="h-7 w-7" />
            Manage Holidays
          </CardTitle>
          <CardDescription>
            Add new holidays or remove existing ones. Holidays will be marked as fully booked on the availability calendar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AddHolidayForm />
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-headline text-primary">Current Holidays</CardTitle>
        </CardHeader>
        <CardContent>
          {holidays.length === 0 ? (
            <p className="text-muted-foreground">No holidays currently defined.</p>
          ) : (
            <ul className="space-y-3">
              {holidays.map((holiday) => (
                <li
                  key={holiday.id}
                  className="flex items-center justify-between p-4 border rounded-lg bg-card hover:bg-muted/50 transition-colors"
                >
                  <div>
                    <p className="font-semibold text-foreground">{holiday.name}</p>
                    <p className="text-sm text-muted-foreground">{format(holiday.date, "EEEE, MMMM do, yyyy")}</p>
                  </div>
                  <RemoveHolidayButton holidayId={holiday.id} holidayName={holiday.name} />
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

    