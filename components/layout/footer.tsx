import { MapPin } from 'lucide-react';

export function Footer() {
  const currentYear = new Date().getFullYear();
  return (
    <footer className="bg-secondary/50 text-secondary-foreground py-8 mt-12">
      <div className="container mx-auto px-4 text-center">
        <div className="flex justify-center items-center gap-2 mb-2">
          <MapPin className="h-5 w-5 text-primary" />
          <p>Treebon Resorts, Kollangana, Kasargod, Kerala</p>
        </div>
        <p className="text-sm">
          &copy; {currentYear} Treebon Events Hub. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
