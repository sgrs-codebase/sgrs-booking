import { NextRequest, NextResponse } from 'next/server';
import { getToursFromAirtable, saveOrderToAirtable } from '@/lib/airtable';
import { buildPaymentUrl, OnePayParams } from '@/lib/onepay';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tourId, adults, children, infants, customerInfo, date, returnDate, guests } = body;

    // 1. Validate Tour (Fetch from Airtable)
    const tours = await getToursFromAirtable();
    const tour = tours.find(t => t.id === tourId);

    if (!tour) {
      return NextResponse.json({ error: 'Invalid Tour ID' }, { status: 400 });
    }

    // 2. Calculate Price (Server-side validation)
    const amount = (adults * tour.adultPrice) + (children * tour.childPrice) + (infants * tour.infantPrice);
    
    if (amount === 0) {
      return NextResponse.json({ error: 'Invalid Amount' }, { status: 400 });
    }

    // 3. Validate OnePay Configuration
    const env = process.env || {};
    const merchant = env.ONEPAY_MERCHANT || '';
    const accessCode = env.ONEPAY_ACCESS_CODE || '';
    const secret = env.ONEPAY_HASH_SECRET || '';
    const baseUrl = env.ONEPAY_URL || '';

    console.log('OnePay Config:', { merchant, accessCode, baseUrl, hasSecret: !!secret });

    console.log('Received Customer Info:', customerInfo);

    if (!merchant || !accessCode || !secret) {
      console.error('Missing OnePay Configuration:', { 
        merchant: !!merchant, 
        accessCode: !!accessCode, 
        secret: !!secret 
      });
      return NextResponse.json({ error: 'Payment Gateway Configuration Error' }, { status: 500 });
    }

    // 4. Prepare OnePay Parameters
    // Note: OnePay requires amount in VND * 100
    const amountInCents = (amount * 100).toString();
    const orderId = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    // Get client IP - simplistic approach for Next.js App Router
    const forwardedFor = request.headers.get('x-forwarded-for');
    const clientIp = forwardedFor ? forwardedFor.split(',')[0] : '127.0.0.1';

    // Sanitize OrderInfo and MerchTxnRef (remove special characters and accents)
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

    let customerEmail = '';
     let customerPhone = '';
     try {
        customerEmail = customerInfo?.email ? String(customerInfo.email).trim() : '';
        // Strict Phone Sanitization: Digits only
        customerPhone = customerInfo?.phone ? String(customerInfo.phone).replace(/\D/g, '') : '';
     } catch (e) {
        console.error('Customer info parsing error:', e);
     }
 
     // Strict OrderInfo Sanitization: Alphanumeric and spaces only, no special chars
     const orderInfoSource = `Booking ${tour.name} ${customerEmail}`;
     const orderInfo = sanitize(orderInfoSource)
       .replace(/[^a-zA-Z0-9\s]/g, "") // Remove ALL special chars including hyphens/dots
       .substring(0, 100); // Limit length strictly
     
     const safeOrderId = sanitize(orderId);

    // Save "Pending" Order to Airtable
    await saveOrderToAirtable({
      OrderID: safeOrderId,
      Timestamp: new Date().toISOString(),
      CustomerName: customerInfo ? `${customerInfo.firstName} ${customerInfo.lastName}` : 'Guest',
      Email: customerEmail,
      Phone: customerPhone,
      TourID: tourId,
      Guests: `${adults} Adults, ${children} Children, ${infants} Infants`,
      Amount: amount.toString(),
      PaymentStatus: 'Pending',
      OnePayRef: '',
      FullGuestDetails: JSON.stringify(guests || []),
      TravelDate: date, // Single Date
      ReturnDate: returnDate // Optional Return Date
    });

    const params: OnePayParams = {
      vpc_AccessCode: accessCode,
      vpc_Amount: amountInCents,
      vpc_Command: 'pay',
      vpc_Currency: 'VND',
      vpc_Locale: 'vn', // Changed from 'en' to 'vn' per requirement
      vpc_MerchTxnRef: safeOrderId,
      vpc_Merchant: merchant,
      vpc_OrderInfo: orderInfo,
      vpc_ReturnURL: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/ipn`,
      vpc_Version: '2',
      vpc_TicketNo: clientIp,
      Title: 'VPC 3-Party',
      AgainLink: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/booking`,
      vpc_Customer_Email: customerEmail,
      vpc_Customer_Phone: customerPhone,
    };

    console.log('OnePay Params constructed:', JSON.stringify(params)); // Debugging

    // 5. Generate Payment URL
    let paymentUrl;
    try {
      paymentUrl = buildPaymentUrl(
        params,
        baseUrl,
        secret
      );
    } catch (signError) {
      console.error('Signing/BuildURL Error:', signError);
      throw new Error(`Signing failed: ${signError instanceof Error ? signError.message : String(signError)}`);
    }

    console.log('Generated Payment URL:', paymentUrl); // Debugging

    // 6. Save "Pending" Order to Airtable (Moved to step 4.5)


    return NextResponse.json({ paymentUrl });
  } catch (error) {
    console.error('Checkout Critical Error:', error);
    // Log the full stack trace if available
    if (error instanceof Error && error.stack) {
      console.error('Stack:', error.stack);
    }
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: `Internal Server Error: ${errorMessage}` }, { status: 500 });
  }
}
