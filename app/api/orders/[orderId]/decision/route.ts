import { NextRequest, NextResponse } from 'next/server';
import { getOrderFromAirtable, setOrderDecision } from '@/lib/airtable';
import { sendBookingConfirmedEmail } from '@/lib/email';

/**
 * Called after SGRS manually checks a bank transfer.
 *
 *   POST /api/orders/<orderId>/decision
 *   Header: x-admin-secret: <ADMIN_WEBHOOK_SECRET>
 *   Body:   { "action": "confirm" }  |  { "action": "reject" }
 *
 * confirm -> marks the order paid/confirmed and sends the confirmation email
 * reject  -> marks it cancelled, which releases the slots it was holding
 *
 * Safe to call twice: an order already in its final state is a no-op, so an
 * Airtable automation firing repeatedly will not send duplicate emails.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const secret = process.env.ADMIN_WEBHOOK_SECRET;
    if (!secret) {
      console.error('[Decision] ADMIN_WEBHOOK_SECRET is not configured');
      return NextResponse.json({ error: 'Server not configured' }, { status: 500 });
    }

    if (request.headers.get('x-admin-secret') !== secret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { orderId } = await params;
    const body = await request.json().catch(() => ({}));
    const action = body?.action;

    if (action !== 'confirm' && action !== 'reject') {
      return NextResponse.json(
        { error: "Invalid action. Use { \"action\": \"confirm\" } or { \"action\": \"reject\" }" },
        { status: 400 }
      );
    }

    const order = await getOrderFromAirtable(orderId);
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Idempotency guard - never email the same guest twice
    const alreadyConfirmed = order.booking_status === 'confirmed' && order.payment_status === 'paid';
    const alreadyCancelled = order.booking_status === 'cancelled';

    if ((action === 'confirm' && alreadyConfirmed) || (action === 'reject' && alreadyCancelled)) {
      console.log(`[Decision] Order ${orderId} is already ${action}ed, skipping`);
      return NextResponse.json({ ok: true, orderId, action, alreadyProcessed: true });
    }

    if (action === 'confirm' && alreadyCancelled) {
      return NextResponse.json(
        { error: 'Order was cancelled and cannot be confirmed automatically' },
        { status: 409 }
      );
    }

    const updated = await setOrderDecision(orderId, action);
    if (!updated) {
      return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
    }

    if (action === 'reject') {
      // Slots are released by the status change itself; no guest email here.
      return NextResponse.json({ ok: true, orderId, action, slotsReleased: true });
    }

    const emailSent = await sendBookingConfirmedEmail(orderId);
    return NextResponse.json({ ok: true, orderId, action, emailSent });
  } catch (error) {
    console.error('[Decision] Error:', error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: `Internal Server Error: ${message}` }, { status: 500 });
  }
}
