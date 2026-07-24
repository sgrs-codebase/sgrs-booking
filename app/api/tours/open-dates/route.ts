import { NextRequest, NextResponse } from 'next/server';
import { getOpenTourDates } from '@/lib/airtable';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tourId = searchParams.get('tourId');

    if (!tourId) {
      return NextResponse.json({ error: 'Missing tourId' }, { status: 400 });
    }

    const openDates = await getOpenTourDates(tourId);

    return NextResponse.json({
      openDates: openDates.map(d => ({
        date: d.date,
        departure_time: d.departure_time,
        date_type: d.date_type,
        total_slots: d.total_slots
      }))
    });

  } catch (error) {
    console.error('Failed to fetch open dates:', error);
    return NextResponse.json({ error: 'Failed to fetch open dates' }, { status: 500 });
  }
}
