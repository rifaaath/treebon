
'use client';

/**
 * @fileOverview Admin-configurable settings for the application.
 * Holiday management is now handled in Firestore via src/services/bookingService.ts.
 * This file can be used for other static admin settings in the future or removed if not needed.
 */

// Holiday data is now managed in Firestore.
// The `markDateAsHoliday` function in `src/services/bookingService.ts`
// can be used by an admin interface (to be built) to update holidays in Firestore.

// Example:
// To mark '2024-12-25' as Christmas:
// await markDateAsHoliday(new Date('2024-12-25'), 'Christmas Day');

// This ensures the file is treated as a module.
export {};
