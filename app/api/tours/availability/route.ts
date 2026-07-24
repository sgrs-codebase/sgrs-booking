import { NextRequest, NextResponse } from 'next/server';
import { getTourDate, getOrdersByTourAndDate } from '@/lib/airtable';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tourId = searchParams.get('tourId');
    const date = searchParams.get('date');
    const time = searchParams.get('time');

    if (!tourId || !date) {
      return NextResponse.json({ error: 'Missing tourId or date' }, { status: 400 });
    }

    // Fetch total slots configuration
    const tourDate = await getTourDate(tourId, date, time || undefined, false);
    
    if (!tourDate) {
      return NextResponse.json({ 
        isOpen: false,
        totalSlots: 0,
        paidSlots: 0,
        pendingSlots: 0,
        availableSlots: 0
      });
    }

    const totalSlots = tourDate.total_slots;

    // Fetch existing orders for the date and time
    const orders = await getOrdersByTourAndDate(tourId, date, time || undefined, false);

    let paidSlots = 0;
    let pendingSlots = 0;

    orders.forEach(order => {
      const slots = (order.Adults || 0) + (order.Children || 0);
      if (order.payment_status === 'paid') {
        paidSlots += slots;
      } else if (order.payment_status === 'pending') {
        pendingSlots += slots;
      }
    });

    const availableSlots = Math.max(0, totalSlots - (paidSlots + pendingSlots));

    return NextResponse.json({
      isOpen: true,
      totalSlots,
      paidSlots,
      pendingSlots,
      availableSlots
    });

  } catch (error) {
    console.error('Failed to fetch availability:', error);
    return NextResponse.json({ error: 'Failed to fetch availability' }, { status: 500 });
  }
}
