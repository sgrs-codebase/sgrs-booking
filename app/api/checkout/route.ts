import { NextRequest, NextResponse } from 'next/server';
import { 
  getToursFromAirtable, 
  saveOrderToAirtable, 
  generateOrderId, 
  getOrdersByEmailAndDate, 
  getTourDate, 
  createTourDate, 
  calculateAvailableSlots,
  getOrdersByTourAndDate
} from '@/lib/airtable';
import { buildPaymentUrl, OnePayParams } from '@/lib/onepay';
import { Resend } from 'resend';
import { AwaitingConfirmation } from '@/components/emails/AwaitingConfirmation';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tourId, adults: adultsRaw, children: childrenRaw, infants: infantsRaw, customerInfo, date, returnDate, time, guests } = body;

    const adults = Number(adultsRaw || 0);
    const children = Number(childrenRaw || 0);
    const infants = Number(infantsRaw || 0);

    console.log(`[Checkout] Processing order for ${tourId} on ${date}. Adults: ${adults}, Children: ${children}`);

    // 0. Server-side validation
    if (!tourId || !date || !customerInfo?.email || !customerInfo?.phone) {
      console.error('[Checkout] Missing required fields');
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (adults < 0 || children < 0 || infants < 0) {
      console.error(`[Checkout] Invalid guest counts: ${adults}, ${children}, ${infants}`);
      return NextResponse.json({ error: 'Invalid guest counts' }, { status: 400 });
    }

    const travelDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (travelDate < today) {
      console.error(`[Checkout] Travel date in the past: ${date}`);
      return NextResponse.json({ error: 'Travel date cannot be in the past' }, { status: 400 });
    }

    // 1. Validate Tour (Fetch from Airtable)
    const tours = await getToursFromAirtable();
    const tour = tours.find(t => t.id === tourId);

    if (!tour) {
      console.error(`[Checkout] Tour not found: ${tourId}`);
      return NextResponse.json({ error: 'Invalid Tour ID' }, { status: 400 });
    }

    // 2. Check for Duplicate Booking (same email and date within 30 mins) - NO CACHE
    const duplicateOrders = await getOrdersByEmailAndDate(customerInfo.email, date, false);

    if (duplicateOrders.length > 0) {
      console.warn(`[Checkout] Duplicate booking detected for ${customerInfo.email} on ${date}`);
      return NextResponse.json({ 
        error: 'You already have a pending or paid booking for this date. Please check your email or wait 30 minutes to try again.' 
      }, { status: 400 });
    }

    // 3. Get/Create TourDate record and Check Availability - NO CACHE
    let tourDate = await getTourDate(tourId, date, false);
    if (!tourDate) {
      // Double check without cache just in case of race conditions
      const secondCheck = await getTourDate(tourId, date, false);
      if (!secondCheck) {
        console.log(`[Checkout] TourDate record not found, creating for ${tourId} on ${date}`);
        tourDate = await createTourDate({
          tourId,
          date,
          date_type: 'default',
          total_slots: 35
        });
      } else {
        tourDate = secondCheck;
      }
    }


    const availableSlots = await calculateAvailableSlots(tourId, date, false);
    const requestedSlots = adults + children;
    
    console.log(`[Checkout] Availability check: Requested ${requestedSlots}, Available ${availableSlots}`);

    if (availableSlots < requestedSlots) {
      console.warn(`[Checkout] Not enough slots: Requested ${requestedSlots}, Available ${availableSlots}`);
      return NextResponse.json({ 
        error: `Sorry, only ${availableSlots} slots available for this date.` 
      }, { status: 400 });
    }

    // 4. Calculate Price (Server-side validation)
    const amount = (adults * tour.adultPrice) + (children * tour.childPrice) + (infants * tour.infantPrice);

    if (amount === 0) {
      console.error('[Checkout] Calculated amount is 0');
      return NextResponse.json({ error: 'Invalid Amount' }, { status: 400 });
    }

    // 5. Flow Decision Logic - NO CACHE
    // default date + first booking + < 6 adults -> Awaiting confirmation
    // otherwise -> Payment
    let flow: 'payment' | 'awaiting' = 'payment';
    
    if (tourDate?.date_type === 'default') {
      const existingOrders = await getOrdersByTourAndDate(tourId, date, false);
      const isFirstBooking = existingOrders.length === 0;
      
      console.log(`[Checkout] Decision: isFirstBooking=${isFirstBooking}, adults=${adults}`);

      if (isFirstBooking && adults < 6) {
        flow = 'awaiting';
      }
    }

    console.log(`[Checkout] Final Flow: ${flow.toUpperCase()}`);

    // 6. Generate OrderID
    const orderId = await generateOrderId(tourId, date);


    // 7. Sanitize Info
    const sanitize = (str: string) => {
      try {
        if (!str || typeof str !== 'string') return '';
        return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Remove accents
          .replace(/[^a-zA-Z0-9\s-]/g, "") // Remove special chars except space and hyphen
          .trim();
      } catch (e) {
        console.error('Sanitize error:', e);
        return 'SanitizedError';
      }
    };

    const customerEmail = String(customerInfo.email).trim();
    const customerPhone = String(customerInfo.phone).replace(/\D/g, '');

    // 8. Create Order in Airtable
    await saveOrderToAirtable({
      OrderID: orderId,
      Timestamp: new Date().toISOString(),
      CustomerName: `${customerInfo.firstName} ${customerInfo.lastName}`,
      Email: customerEmail,
      Phone: customerPhone,
      TourID: tourId,
      Guests: `${adults} Adults, ${children} Children, ${infants} Infants`,
      Adults: adults,
      Children: children,
      Infants: infants,
      Amount: amount.toString(),
      PaymentStatus: flow === 'payment' ? 'Pending' : 'Awaiting Confirmation',
      booking_status: 'awaiting_confirmation', // Always starts here
      payment_status: 'pending',
      OnePayRef: '',

      FullGuestDetails: JSON.stringify(guests || []),
      TravelDate: date,
      ReturnDate: returnDate,
      DepartureTime: time
    });

    if (flow === 'awaiting') {
      // Send Awaiting Confirmation Email
      try {
        const adminEmail = process.env.ADMIN_EMAIL || 'info@saigonriverstar.com';
        await resend.emails.send({
          from: process.env.FROM_EMAIL || 'onboarding@resend.dev',
          to: [customerEmail, adminEmail],
          subject: `Booking Request Received - ${orderId}`,
          react: AwaitingConfirmation({
            orderId,
            tourName: tour.name,
            tourSubtitle: tour.subtitle,
            travelDate: date,
            returnDate,
            departureTime: time,
            guestCountsStr: `${adults} Adults, ${children} Children, ${infants} Infants`,
            amount: amount.toString(),
          }),
        });
      } catch (emailError) {
        console.error('Email sending error (Awaiting Confirmation):', emailError);
        // Don't fail the whole request if email fails
      }

      return NextResponse.json({ awaitingConfirmation: true, orderId });
    }

    // 9. Payment Flow - OnePay
    const env = process.env || {};
    const merchant = env.ONEPAY_MERCHANT || '';
    const accessCode = env.ONEPAY_ACCESS_CODE || '';
    const secret = env.ONEPAY_HASH_SECRET || '';
    const baseUrl = env.ONEPAY_URL || '';

    if (!merchant || !accessCode || !secret) {
      return NextResponse.json({ error: 'Payment Gateway Configuration Error' }, { status: 500 });
    }

    const amountInCents = (amount * 100).toString();
    const forwardedFor = request.headers.get('x-forwarded-for');
    const clientIp = forwardedFor ? forwardedFor.split(',')[0] : '127.0.0.1';

    const orderInfoSource = `Booking ${tour.name} ${customerEmail}`;
    const orderInfo = sanitize(orderInfoSource)
      .replace(/[^a-zA-Z0-9\s]/g, "")
      .substring(0, 100);

    const params: OnePayParams = {
      vpc_AccessCode: accessCode,
      vpc_Amount: amountInCents,
      vpc_Command: 'pay',
      vpc_Currency: 'VND',
      vpc_Locale: 'en',
      vpc_MerchTxnRef: orderId,
      vpc_Merchant: merchant,
      vpc_OrderInfo: orderInfo,
      vpc_ReturnURL: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/ipn`,
      vpc_Version: '2',
      vpc_TicketNo: clientIp,
      user_Customer_Email: customerEmail,
      user_Customer_Phone: customerPhone,
    };

    let paymentUrl;
    try {
      paymentUrl = buildPaymentUrl(params, baseUrl, secret);
    } catch (signError) {
      console.error('Signing/BuildURL Error:', signError);
      throw new Error(`Signing failed: ${signError instanceof Error ? signError.message : String(signError)}`);
    }

    return NextResponse.json({ paymentUrl });
  } catch (error) {
    console.error('Checkout Critical Error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: `Internal Server Error: ${errorMessage}` }, { status: 500 });
  }
}

