import { NextResponse } from 'next/server';
import { getToursFromAirtable } from '@/lib/airtable';

export async function GET() {
  try {
    const tours = await getToursFromAirtable();
    return NextResponse.json(tours);
  } catch (error) {
    console.error('Failed to fetch tours:', error);
    return NextResponse.json({ error: 'Failed to fetch tours' }, { status: 500 });
  }
}
