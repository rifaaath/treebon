import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import type { PastEvent } from '@/data/past-events';

interface EventCardProps {
  event: PastEvent;
}

export function EventCard({ event }: EventCardProps) {
  return (
    <Card className="overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out transform hover:-translate-y-1">
      <CardHeader className="p-0">
        <div className="relative w-full h-48">
          <Image
            src={event.imageUrl}
            alt={event.title}
            layout="fill"
            objectFit="cover"
            data-ai-hint={event.imageHint}
          />
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <CardTitle className="text-xl font-headline mb-2 text-primary">{event.title}</CardTitle>
        <CardDescription className="text-muted-foreground text-sm line-clamp-3">{event.description}</CardDescription>
      </CardContent>
    </Card>
  );
}
