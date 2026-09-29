import { NextRequest, NextResponse } from 'next/server';
import { processOnePayResult } from '@/lib/onepay-result';

/**
 * Browser return from OnePay (vpc_ReturnURL). Stores the result - in case the
 * IPN on /api/callback hasn't arrived yet - and sends the guest to the result page.
 */
export async function GET(request: NextRequest) {
  const params: Record<string, string> = {};
  request.nextUrl.searchParams.forEach((value, key) => {
    params[key] = value;
  });

  const result = await processOnePayResult(params);
  console.log(`OnePay return for Order ${result.orderId}: Code ${result.responseCode}, Verified ${result.verified}`);

  if (result.paid) {
    const successUrl = new URL('/booking/success', request.url);
    successUrl.searchParams.set('orderId', result.orderId);
    return NextResponse.redirect(successUrl);
  }

  const failedUrl = new URL('/booking/failed', request.url);
  failedUrl.searchParams.set('reason', result.verified ? 'payment_failed' : 'invalid_signature');
  if (result.responseCode) failedUrl.searchParams.set('code', result.responseCode);
  return NextResponse.redirect(failedUrl);
}
