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
    try {
      const { updateOrderStatusAirtable, saveOrderToAirtable } = await import('@/lib/airtable');
      
      const txnRef = params['vpc_MerchTxnRef'] || '';
      
      // Strategy: Try to update existing "Pending" order first
      const updated = await updateOrderStatusAirtable(orderId, 'Paid', txnRef);
      
      if (!updated) {
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
          OnePayRef: txnRef,
          FullGuestDetails: '{"note": "Created from IPN Fallback, no details"}'
        });
      }
      
    } catch (dbError) {
      console.error('Failed to save/update Airtable:', dbError);
    }

    // TODO: Phase 4 - Send Email via Resend

    // Redirect to success page
    const successUrl = new URL('/booking/success', request.url);
    successUrl.searchParams.set('orderId', orderId);
    return NextResponse.redirect(successUrl);
  } else {
    // Payment Failed or Signature Mismatch
    
    const failedUrl = new URL('/booking/failed', request.url);
    failedUrl.searchParams.set('reason', isVerified ? 'payment_failed' : 'invalid_signature');
    if (responseCode) failedUrl.searchParams.set('code', responseCode);
    
    return NextResponse.redirect(failedUrl);
  }
}
