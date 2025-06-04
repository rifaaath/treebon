
import type React from 'react';
import Link from 'next/link';
import { ShieldCheck, ListOrdered, CalendarOff } from 'lucide-react'; 
import { Button } from '@/components/ui/button';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col md:flex-row gap-8 items-start">
        <aside className="w-full md:w-64 space-y-4 md:sticky md:top-24">
            <h2 className="text-2xl font-headline text-primary flex items-center gap-2">
                <ShieldCheck className="h-7 w-7" /> Admin Panel
            </h2>
            <nav className="flex flex-col gap-2">
                <Button variant="ghost" asChild className="justify-start">
                    <Link href="/admin" className="flex items-center gap-2">
                       {/* <LayoutDashboard className="h-4 w-4" />  Using default icon instead of specific for now */}
                        Dashboard
                    </Link>
                </Button>
                <Button variant="ghost" asChild className="justify-start">
                    <Link href="/admin/bookings" className="flex items-center gap-2">
                        <ListOrdered className="h-4 w-4" />
                        Manage Bookings
                    </Link>
                </Button>
                <Button variant="ghost" asChild className="justify-start">
                    <Link href="/admin/holidays" className="flex items-center gap-2">
                        <CalendarOff className="h-4 w-4" />
                        Manage Holidays
                    </Link>
                </Button>
                {/* Add more admin links here: e.g., Site Settings */}
            </nav>
        </aside>
        <main className="flex-1">
            {children}
        </main>
    </div>
  );
}
