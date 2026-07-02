import { NextRequest, NextResponse } from 'next/server';
import { getOrderFromAirtable, getToursFromAirtable } from '@/lib/airtable';
import { buildPaymentUrl, OnePayParams } from '@/lib/onepay';

export async function POST(request: NextRequest) {
  try {
    const { orderId } = await request.json();

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    // 1. Fetch order from Airtable
    const order = await getOrderFromAirtable(orderId);
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // 2. Check if already paid
    if (order.payment_status === 'paid' || order.PaymentStatus === 'Paid') {
      return NextResponse.json({ error: 'Order already paid' }, { status: 400 });
    }

    // 3. Fetch tour info to get the name for OrderInfo
    const tours = await getToursFromAirtable();
    const tour = tours.find(t => t.id === order.TourID);
    const tourName = tour ? tour.name : 'Tour';

    // 4. OnePay Config
    const env = process.env || {};
    const merchant = env.ONEPAY_MERCHANT || '';
    const accessCode = env.ONEPAY_ACCESS_CODE || '';
    const secret = env.ONEPAY_HASH_SECRET || '';
    const baseUrl = env.ONEPAY_URL || '';

    if (!merchant || !accessCode || !secret) {
      return NextResponse.json({ error: 'Payment Gateway Configuration Error' }, { status: 500 });
    }

    // 5. Sanitize and prepare params
    const sanitize = (str: string) => {
      try {
        if (!str || typeof str !== 'string') return '';
        return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-zA-Z0-9\s-]/g, "")
          .trim();
      } catch (e) {
        return 'SanitizedError';
      }
    };

    const amountInCents = (Number(order.Amount) * 100).toString();
    const orderInfo = sanitize(`Payment for ${tourName} ${orderId}`)
      .replace(/[^a-zA-Z0-9\s]/g, "")
      .substring(0, 100);

    const forwardedFor = request.headers.get('x-forwarded-for');
    const clientIp = forwardedFor ? forwardedFor.split(',')[0] : '127.0.0.1';

    const params: OnePayParams = {
      vpc_AccessCode: accessCode,
      vpc_Amount: amountInCents,
      vpc_Command: 'pay',
      vpc_Currency: 'VND',
      vpc_Locale: 'en',
      vpc_MerchTxnRef: order.OrderID,
      vpc_Merchant: merchant,
      vpc_OrderInfo: orderInfo,
      vpc_ReturnURL: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/ipn`,
      vpc_Version: '2',
      vpc_TicketNo: clientIp,
      user_Customer_Email: order.Email,
      user_Customer_Phone: order.Phone,
    };

    const paymentUrl = buildPaymentUrl(params, baseUrl, secret);

    return NextResponse.json({ paymentUrl });

  } catch (error) {
    console.error('Repay Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
