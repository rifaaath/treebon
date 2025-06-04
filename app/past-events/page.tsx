import { EventCard } from '@/components/event-card';
import { pastEventsData } from '@/data/past-events';
import { GalleryThumbnails } from 'lucide-react';

export default function PastEventsPage() {
  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold font-headline text-primary mb-4 flex items-center justify-center gap-3">
          <GalleryThumbnails className="h-10 w-10" />
          Past Events Showcase
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Get inspired by the beautiful and memorable events hosted at Treebon Resorts. See how our spaces can be transformed for your special occasion.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {pastEventsData.map((event) => (
          <EventCard key={event.id} event={event} />
        ))}
      </div>
    </div>
  );
}
