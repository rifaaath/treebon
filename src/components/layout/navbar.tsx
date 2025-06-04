
"use client";

import Link from 'next/link';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetClose } from '@/components/ui/sheet';
import { Menu, Home, GalleryThumbnails, CalendarCheck, Sparkles, ShieldCheck } from 'lucide-react';
import { Logo } from '@/components/logo'; 

const navItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/past-events', label: 'Past Events', icon: GalleryThumbnails },
  { href: '/availability', label: 'Availability & Booking', icon: CalendarCheck },
  { href: '/ai-event-planner', label: 'AI Event Planner', icon: Sparkles },
  // For now, let's add an admin link. In a real app, this would be conditional based on user role.
  { href: '/admin', label: 'Admin', icon: ShieldCheck, admin: true },
];

export function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  // In a real app, you'd get isAdmin from auth state.
  const isAdminUser = true; // Placeholder: assume user is admin for link visibility

  return (
    <header className="bg-background/80 backdrop-blur-sm shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Link href="/" className="flex items-center gap-2" aria-label="Treebon Resorts Home">
          <Logo className="h-10 md:h-12 w-auto" />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex gap-6 items-center">
          {navItems.map((item) => {
            if (item.admin && !isAdminUser) return null; // Hide admin link if not admin
            return (
              <Link key={item.href} href={item.href} className="text-foreground hover:text-primary transition-colors font-medium">
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Mobile Navigation */}
        <div className="md:hidden">
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px] bg-background p-6">
              <div className="mb-8">
                 <SheetClose asChild>
                    <Link href="/" className="flex items-center gap-2" aria-label="Treebon Resorts Home">
                        <Logo className="h-10 w-auto" />
                    </Link>
                 </SheetClose>
              </div>
              <div className="flex flex-col gap-6">
                {navItems.map((item) => {
                  if (item.admin && !isAdminUser) return null;
                  return (
                    <SheetClose key={item.href} asChild>
                       <Link href={item.href} className="flex items-center gap-3 p-2 rounded-md hover:bg-muted text-lg text-foreground hover:text-primary transition-colors">
                        <item.icon className="h-5 w-5" />
                        {item.label}
                      </Link>
                    </SheetClose>
                  );
                })}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}

    