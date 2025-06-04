import Image from 'next/image';
import type React from 'react';
import { cn } from '@/lib/utils';

interface LogoProps extends React.HTMLAttributes<HTMLDivElement> {
  textColor?: string;
  iconSrc?: string; 
}

export function Logo({ 
  className, 
  textColor = "hsl(var(--primary))", 
  iconSrc = "/treebon-icon.png", // Default path for the uploaded icon in /public
  ...props 
}: LogoProps) {
  return (
    // This root div will be sized by the className prop (e.g., h-10 md:h-12 from Navbar)
    <div className={cn("flex items-center gap-2", className)} {...props}>
      {/* Icon container: Takes full height from parent, is square, and has a primary color background */}
      <div 
        className="h-full aspect-square rounded-full flex items-center justify-center p-1" 
        style={{ backgroundColor: 'hsl(var(--primary))' }} 
      >
        {/* Inner div for Next/Image with layout="fill" needs to be relative */}
        <div className="relative w-full h-full"> 
            <Image
              src={iconSrc} 
              alt="Treebon Resorts Icon"
              layout="fill" 
              objectFit="contain" // Ensures the image scales nicely within the container
            />
        </div>
      </div>
      {/* Text part of the logo */}
      <span 
        style={{ color: textColor }} 
        className="font-bold text-lg md:text-xl font-headline whitespace-nowrap"
      >
        Treebon Resorts
      </span>
    </div>
  );
}
