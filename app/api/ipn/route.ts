import { NextRequest, NextResponse } from 'next/server';
import { verify } from '@/lib/onepay';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const params: Record<string, string> = {};

  // Convert URLSearchParams to Record<string, string>
  searchParams.forEach((value, key) => {
    params[key] = value;
  });

  const secret = process.env.ONEPAY_HASH_SECRET || '';

  const isVerified = verify(params, secret);
  const responseCode = params['vpc_TxnResponseCode'];
  const orderId = params['vpc_MerchTxnRef'];

  // Log the transaction attempt
  console.log(`IPN received for Order ${orderId}: Code ${responseCode}, Verified ${isVerified}`);

  if (isVerified && responseCode === '0') {
    // Payment Successful

    // Save to Airtable
    const txnRef = params['vpc_MerchTxnRef'] || '';

    try {
      const { updateOrderStatusAirtable, saveOrderToAirtable } = await import('@/lib/airtable');

      // Strategy: Try to update existing "Pending" order first
      // The update function now returns the Record object if successful, or false
      const updatedRecord = await updateOrderStatusAirtable(orderId, 'Paid', txnRef, 'confirmed');

      if (!updatedRecord) {
        // Fallback: If no pending order found (e.g., save failed earlier), create a new row
        // We have limited info here, but it's better than nothing.
        const orderInfo = params['vpc_OrderInfo'] || '';
        const amount = params['vpc_Amount'] ? (parseInt(params['vpc_Amount']) / 100).toString() : '0';

        console.warn(`Order ${orderId} not found for update. Creating new row from IPN data.`);

        await saveOrderToAirtable({
          OrderID: orderId,
          Timestamp: new Date().toISOString(),
          CustomerName: 'Guest (From IPN)',
          Email: params['vpc_Customer_Email'] || '',
          Phone: params['vpc_Customer_Phone'] || '',
          TourID: 'Unknown',
          Guests: orderInfo,
          Amount: amount,
          PaymentStatus: 'Paid (Fallback)',
          booking_status: 'confirmed',
          payment_status: 'paid',
          OnePayRef: txnRef,
          FullGuestDetails: '{"note": "Created from IPN Fallback, no details"}',
          TravelDate: 'N/A (IPN Fallback)'
        });

      }

    } catch (dbError) {
      console.error('Failed to save/update Airtable:', dbError);
    }

    // Send the confirmation email (shared with the manual-confirmation webhook)
    try {
      const { sendBookingConfirmedEmail } = await import('@/lib/email');
      const paidAmount = params['vpc_Amount']
        ? (parseInt(params['vpc_Amount']) / 100).toString()
        : undefined;

      await sendBookingConfirmedEmail(orderId, paidAmount);
    } catch (emailError) {
      console.error('Failed to send email:', emailError);
    }

    // Redirect to success page
    const successUrl = new URL('/booking/success', request.url);
    successUrl.searchParams.set('orderId', orderId);
    return NextResponse.redirect(successUrl);
  } else {
    // Payment Failed or Signature Mismatch

    // Update Airtable to Failed/Cancelled
    try {
      const { updateOrderStatusAirtable } = await import('@/lib/airtable');
      const status = responseCode === '99' ? 'Cancelled' : 'Failed';
      await updateOrderStatusAirtable(orderId, status, params['vpc_MerchTxnRef'] || '');
    } catch (error) {
      console.error('Failed to update Airtable status on failure:', error);
    }

    const failedUrl = new URL('/booking/failed', request.url);
    failedUrl.searchParams.set('reason', isVerified ? 'payment_failed' : 'invalid_signature');
    if (responseCode) failedUrl.searchParams.set('code', responseCode);

    return NextResponse.redirect(failedUrl);
  }
}
