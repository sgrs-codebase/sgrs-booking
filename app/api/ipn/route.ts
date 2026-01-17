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
    
    // TODO: Phase 4 - Save to Google Sheets
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
