// ==========================================================================
// Tour Data - Types and Interfaces for Tour Information
// ==========================================================================

export interface Tour {
  id: string;
  name: string;
  subtitle: string;
  type: 'Day-tour' | 'Multi-day' | 'Cruise' | string;
  bookingType: 'day-tour' | 'overnight-tour' | string;
  duration: string;
  image: string;
  codeName?: string;
  adultPrice: number;
  childPrice: number;
  infantPrice: number;
  includes: string[];
  notes: string[];
  startTimes?: string[];
  notices?: string; // HTML or plain text for notices section
  forceMajeure?: string; // HTML or plain text for force majeure section
}

/**
 * Note: Data is now fetched dynamically from Airtable.
 * Fallback hardcoded data has been removed per user requirement.
 */
export const TOURS: Record<string, Tour> = {};

export function getTourById(tourId: string): Tour | undefined {
  return TOURS[tourId];
}

export function getAllTours(): Tour[] {
  return Object.values(TOURS);
}

export function calculateTotalPrice(
  tour: Tour,
  adults: number,
  children: number,
  infants: number = 0
): number {
  if (!tour) return 0;
  return adults * tour.adultPrice + children * tour.childPrice + infants * tour.infantPrice;
}
