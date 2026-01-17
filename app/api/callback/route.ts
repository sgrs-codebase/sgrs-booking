import { NextRequest, NextResponse } from 'next/server';
import { verify } from '@/lib/onepay';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const params: Record<string, string> = {};
  
  // Convert URLSearchParams to Record<string, string>
  searchParams.forEach((value, key) => {
    params[key] = value;
  });

  // Prefer environment variables, but fallback to provided test credentials if missing
  const secret = process.env.ONEPAY_HASH_SECRET || '6D0870CDE5F24F34F3915FB0045120DB';
  
  const isVerified = verify(params, secret);
  const responseCode = params['vpc_TxnResponseCode'];
  const orderId = params['vpc_MerchTxnRef'];

  console.log(`Callback IPN received for Order ${orderId}: Code ${responseCode}, Verified ${isVerified}`);

  if (isVerified && responseCode === '0') {
    // Payment Successful
    // Perform server-side logic (update DB, send email, etc.)
    return new NextResponse('responsecode=1&desc=confirm-success', {
      status: 200,
    });
  } else {
    // Payment Failed or Signature Mismatch
    return new NextResponse('responsecode=0&desc=confirm-fail', {
      status: 200, // OnePay expects 200 even for failure acknowledgment? Or maybe just ignore. 
                   // Usually 200 with fail code is better than 500.
    });
  }
}

export async function POST(request: NextRequest) {
  // Handle POST IPN if OnePay sends POST
  try {
    const formData = await request.formData();
    const params: Record<string, string> = {};
    formData.forEach((value, key) => {
      params[key] = value.toString();
    });

    const secret = process.env.ONEPAY_HASH_SECRET || '6D0870CDE5F24F34F3915FB0045120DB';
    const isVerified = verify(params, secret);
    const responseCode = params['vpc_TxnResponseCode'];
    const orderId = params['vpc_MerchTxnRef'];

    console.log(`POST IPN received for Order ${orderId}: Code ${responseCode}, Verified ${isVerified}`);

    if (isVerified && responseCode === '0') {
      return new NextResponse('responsecode=1&desc=confirm-success', { status: 200 });
    } else {
      return new NextResponse('responsecode=0&desc=confirm-fail', { status: 200 });
    }
  } catch (error) {
    console.error('IPN POST Error:', error);
    return new NextResponse('responsecode=0&desc=error', { status: 200 });
  }
}
