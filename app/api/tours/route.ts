import { NextResponse } from 'next/server';
import { getToursFromAirtable, TourRecord } from '@/lib/airtable';

// Simple in-memory cache
let cachedTours: TourRecord[] | null = null;
let lastFetchTime = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function GET() {
  try {
    const now = Date.now();
    if (cachedTours && (now - lastFetchTime < CACHE_TTL)) {
      return NextResponse.json(cachedTours);
    }

    const tours = await getToursFromAirtable();
    
    // Sort tours if needed, or just return as is
    // Airtable returns in view order usually, or random.
    // Let's rely on Airtable order for now.
    
    cachedTours = tours;
    lastFetchTime = now;
    
    return NextResponse.json(tours);
  } catch (error) {
    console.error('Failed to fetch tours:', error);
    return NextResponse.json({ error: 'Failed to fetch tours' }, { status: 500 });
  }
}
