
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ListOrdered, CalendarOff, Settings } from "lucide-react";
import Link from "next/link";

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-headline text-primary">Admin Dashboard</CardTitle>
          <CardDescription>Welcome to the Treebon Resorts Admin Panel. Manage your site settings and bookings here.</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Select an option from the sidebar to manage bookings or site holidays.</p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link href="/admin/bookings">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Manage Bookings</CardTitle>
              <ListOrdered className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-accent">View Bookings</div>
              <p className="text-xs text-muted-foreground">
                Review and manage event booking requests.
              </p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/admin/holidays">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Manage Holidays</CardTitle>
              <CalendarOff className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-accent">View & Edit</div>
              <p className="text-xs text-muted-foreground">
                Add, remove, or view designated holiday dates.
              </p>
            </CardContent>
          </Card>
        </Link>
         <Card className="opacity-50 cursor-not-allowed h-full"> {/* Placeholder for future feature */}
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Site Settings</CardTitle>
              <Settings className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Coming Soon</div>
              <p className="text-xs text-muted-foreground">
                Configure general site parameters.
              </p>
            </CardContent>
          </Card>
      </div>
    </div>
  );
}
