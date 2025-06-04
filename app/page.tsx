import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, MapPin, Users, Sparkles, CalendarDays } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="relative h-[50vh] md:h-[70vh] rounded-xl overflow-hidden shadow-xl">
        <Image
          src="https://placehold.co/1200x600.png"
          alt="Treebon Resorts Main Venue"
          layout="fill"
          objectFit="cover"
          className="brightness-75"
          data-ai-hint="resort exterior"
        />
        <div className="absolute inset-0 flex flex-col justify-center items-center text-center bg-black/50 p-6">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 font-headline animate-fade-in-down">
            Host Your Perfect Event at Treebon Resorts
          </h1>
          <p className="text-lg md:text-xl text-gray-200 mb-8 max-w-2xl animate-fade-in-up">
            Discover the ideal setting for weddings, corporate functions, and celebrations amidst the serene beauty of Kollangana, Kasargod.
          </p>
          <div className="flex gap-4 animate-fade-in-up animation-delay-300">
            <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground">
              <Link href="/availability">Check Availability</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="bg-background/20 hover:bg-background/30 text-white border-white hover:border-primary hover:text-primary">
              <Link href="/past-events">View Past Events</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* About Treebon Section */}
      <section className="py-12">
        <Card className="shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-headline text-primary">Welcome to Treebon Resorts</CardTitle>
          </CardHeader>
          <CardContent className="text-lg text-center max-w-3xl mx-auto space-y-4">
            <p>
              Nestled in the heart of Kollangana, Kasargod, Kerala, Treebon Resorts offers a unique blend of natural tranquility and modern elegance, making it the perfect venue for your memorable events. Our versatile spaces can be tailored to suit any occasion, from intimate gatherings to grand celebrations.
            </p>
            <div className="flex justify-center items-center gap-2 text-muted-foreground">
              <MapPin className="h-5 w-5 text-accent" />
              <span>Kollangana, Kasargod, Kerala</span>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Event Capabilities Section */}
      <section className="py-12">
        <h2 className="text-3xl font-bold text-center mb-8 font-headline text-primary">Why Choose Treebon for Your Event?</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[
            { icon: Users, title: "Versatile Spaces", description: "Flexible indoor and outdoor areas adaptable for various event sizes and themes, accommodating up to 500 guests." },
            { icon: Sparkles, title: "Customizable Setups", description: "Work with our team to create bespoke event designs, from elegant wedding decor to professional corporate branding." },
            { icon: CheckCircle, title: "Modern Amenities", description: "Equipped with state-of-the-art audiovisual systems, comfortable seating, and ample parking for your convenience." },
            { icon: CalendarDays, title: "Flexible Booking", description: "Available for morning and evening functions, with clear availability and easy booking requests." },
            { icon: MapPin, title: "Scenic Location", description: "Enjoy the lush greenery and peaceful ambiance, providing a beautiful backdrop for your special day." },
            { icon: Users, title: "Dedicated Support", description: "Our experienced event coordinators are here to assist you every step of the way, ensuring a seamless experience." }
          ].map((feature, index) => (
            <Card key={index} className="shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader className="flex flex-row items-center gap-4">
                <feature.icon className="h-10 w-10 text-accent" />
                <CardTitle className="text-xl font-headline">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="py-12 text-center">
         <Card className="bg-secondary/30 p-8 shadow-lg">
          <h2 className="text-3xl font-bold mb-4 font-headline text-primary">Ready to Plan Your Event?</h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
            Explore our past events for inspiration, check available dates, or use our AI tool to brainstorm event ideas.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button asChild size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground">
              <Link href="/ai-event-planner">Get Event Ideas (AI)</Link>
            </Button>
             <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground">
              <Link href="/availability">Book Your Date</Link>
            </Button>
          </div>
        </Card>
      </section>
    </div>
  );
}
