import { verify } from '@/lib/onepay';

export interface OnePayResult {
  orderId: string;
  responseCode: string;
  verified: boolean;
  /** The order ends up paid (this notification, or an earlier one, succeeded) */
  paid: boolean;
  /** The result was verified and stored - OnePay's IPN retries until this is true */
  handled: boolean;
}

/**
 * Applies a OnePay payment result to the order. Shared by the browser return
 * (vpc_ReturnURL -> /api/ipn) and the server-to-server IPN (vpc_CallbackURL ->
 * /api/callback): whichever arrives first marks the order and sends the
 * confirmation email, the other one sees the order already paid and stops.
 */
export async function processOnePayResult(params: Record<string, string>): Promise<OnePayResult> {
  const secret = process.env.ONEPAY_HASH_SECRET || '';
  const orderId = params['vpc_MerchTxnRef'] || '';
  const responseCode = params['vpc_TxnResponseCode'] || '';
  const verified = !!secret && verify(params, secret);
  const result: OnePayResult = { orderId, responseCode, verified, paid: false, handled: false };

  // Never touch an order on an unsigned request - anyone can call these URLs
  if (!verified || !orderId) return result;

  const { getOrderFromAirtable, updateOrderStatusAirtable, saveOrderToAirtable } = await import('@/lib/airtable');

  try {
    const order = await getOrderFromAirtable(orderId, false);

    if (order && (order.payment_status === 'paid' || order.PaymentStatus === 'Paid')) {
      // Already processed by the other notification - don't downgrade it or email twice
      return { ...result, paid: true, handled: true };
    }

    if (responseCode !== '0') {
      if (order) {
        await updateOrderStatusAirtable(orderId, responseCode === '99' ? 'Cancelled' : 'Failed', orderId);
      }
      return { ...result, handled: true };
    }

    if (order) {
      const updated = await updateOrderStatusAirtable(orderId, 'Paid', orderId, 'confirmed');
      if (!updated) return result;
    } else {
      // The order row is missing (e.g. its save failed at checkout) - keep a record of the payment
      console.warn(`Order ${orderId} not found for update. Creating new row from OnePay data.`);
      const amount = params['vpc_Amount'] ? (parseInt(params['vpc_Amount']) / 100).toString() : '0';
      await saveOrderToAirtable({
        OrderID: orderId,
        Timestamp: new Date().toISOString(),
        CustomerName: 'Guest (From IPN)',
        Email: params['user_Customer_Email'] || '',
        Phone: params['user_Customer_Phone'] || '',
        TourID: 'Unknown',
        Guests: params['vpc_OrderInfo'] || '',
        Amount: amount,
        PaymentStatus: 'Paid (Fallback)',
        booking_status: 'confirmed',
        payment_status: 'paid',
        OnePayRef: orderId,
        FullGuestDetails: '{"note": "Created from IPN Fallback, no details"}',
        TravelDate: 'N/A (IPN Fallback)'
      });
    }
  } catch (dbError) {
    console.error(`[OnePay] Failed to store result for ${orderId}:`, dbError);
    return result;
  }

  try {
    const { sendBookingConfirmedEmail } = await import('@/lib/email');
    const paidAmount = params['vpc_Amount'] ? (parseInt(params['vpc_Amount']) / 100).toString() : undefined;
    await sendBookingConfirmedEmail(orderId, paidAmount);
  } catch (emailError) {
    console.error('Failed to send email:', emailError);
  }

  return { ...result, paid: true, handled: true };
}
