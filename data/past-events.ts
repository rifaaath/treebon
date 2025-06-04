export type PastEvent = {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  imageHint: string;
};

export const pastEventsData: PastEvent[] = [
  {
    id: '1',
    title: 'Grand Wedding Reception',
    description: 'An elegant wedding reception with a classic white and gold theme, catering to 250 guests. Featuring live music and a gourmet buffet in our main hall.',
    imageUrl: 'https://placehold.co/600x400.png',
    imageHint: 'wedding reception',
  },
  {
    id: '2',
    title: 'Corporate Gala Dinner',
    description: 'A sophisticated corporate gala for 150 attendees. Modern setup with branded decor and state-of-the-art audiovisual equipment in our conference suite.',
    imageUrl: 'https://placehold.co/600x400.png',
    imageHint: 'corporate gala',
  },
  {
    id: '3',
    title: 'Birthday Extravaganza',
    description: 'A vibrant 50th birthday celebration with a tropical theme in our garden marquee. Included a DJ, dance floor, and custom cocktail bar for 100 guests.',
    imageUrl: 'https://placehold.co/600x400.png',
    imageHint: 'birthday party',
  },
  {
    id: '4',
    title: 'Product Launch Event',
    description: 'A dynamic product launch event for a new tech gadget. Interactive displays and a presentation stage for 200 media and industry professionals.',
    imageUrl: 'https://placehold.co/600x400.png',
    imageHint: 'product launch',
  },
  {
    id: '5',
    title: 'Traditional Engagement Ceremony',
    description: 'A beautiful traditional engagement ceremony with floral decorations and cultural performances, hosting 300 guests in our banquet hall.',
    imageUrl: 'https://placehold.co/600x400.png',
    imageHint: 'engagement ceremony',
  },
  {
    id: '6',
    title: 'Charity Fundraiser Night',
    description: 'An inspiring charity fundraiser with auctions and guest speakers. The event accommodated 180 guests and featured a formal dinner setup.',
    imageUrl: 'https://placehold.co/600x400.png',
    imageHint: 'charity event',
  },
];
