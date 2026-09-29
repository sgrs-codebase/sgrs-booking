import { NextRequest, NextResponse } from 'next/server';
import { processOnePayResult } from '@/lib/onepay-result';

/**
 * OnePay IPN (vpc_CallbackURL) - server-to-server, so the order is updated even
 * when the guest closes the browser before returning. OnePay keeps retrying
 * until it gets responsecode=1.
 */
async function handleIpn(params: Record<string, string>) {
  const result = await processOnePayResult(params);
  console.log(`OnePay IPN for Order ${result.orderId}: Code ${result.responseCode}, Verified ${result.verified}, Handled ${result.handled}`);

  const body = result.handled ? 'responsecode=1&desc=confirm-success' : 'responsecode=0&desc=confirm-fail';
  return new NextResponse(body, { status: 200, headers: { 'Content-Type': 'text/plain' } });
}

export async function GET(request: NextRequest) {
  const params: Record<string, string> = {};
  request.nextUrl.searchParams.forEach((value, key) => {
    params[key] = value;
  });
  return handleIpn(params);
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const params: Record<string, string> = {};
    formData.forEach((value, key) => {
      params[key] = value.toString();
    });
    return handleIpn(params);
  } catch (error) {
    console.error('IPN POST Error:', error);
    return new NextResponse('responsecode=0&desc=confirm-fail', { status: 200, headers: { 'Content-Type': 'text/plain' } });
  }
}
