import type { GuestDetail } from '@/components/emails/shared';
import { getOrderFromAirtable, getToursFromAirtable, type OrderRecord, type TourRecord } from '@/lib/airtable';

// Single place where transactional emails are rendered and sent, so the IPN,
// the QR checkout and the manual-confirmation webhook all behave the same.

type EmailContext = {
  order: OrderRecord;
  tour: TourRecord | null;
  guestDetails: GuestDetail[];
};

const parseGuestDetails = (raw?: string): GuestDetail[] => {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

async function loadContext(orderId: string): Promise<EmailContext | null> {
  const order = await getOrderFromAirtable(orderId);
  if (!order) {
    console.error(`[Email] Order ${orderId} not found, cannot send email`);
    return null;
  }

  const tours = await getToursFromAirtable();
  const tour = tours.find(t => t.id === order.TourID) || null;

  return { order, tour, guestDetails: parseGuestDetails(order.FullGuestDetails) };
}

async function send(subject: string, html: string, customerEmail?: string): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error('[Email] RESEND_API_KEY missing, skipping send');
    return false;
  }

  const { Resend } = await import('resend');
  const resend = new Resend(apiKey);

  const adminEmail = process.env.ADMIN_EMAIL || 'bookings@saigonriverstar.com';
  const to = customerEmail ? [adminEmail, customerEmail] : [adminEmail];

  const { data, error } = await resend.emails.send({
    from: process.env.FROM_EMAIL || 'onboarding@resend.dev',
    to,
    subject,
    html,
  });

  if (error) {
    console.error('[Email] Resend error:', error);
    return false;
  }

  console.log(`[Email] Sent "${subject}" to ${to.join(', ')}`, data);
  return true;
}

/** "Booking Received" - sent as soon as a QR / bank-transfer order is created. */
export async function sendBookingReceivedEmail(orderId: string): Promise<boolean> {
  try {
    const context = await loadContext(orderId);
    if (!context) return false;

    const { order, tour, guestDetails } = context;
    const { render } = await import('@react-email/render');
    const { AwaitingConfirmation } = await import('@/components/emails/AwaitingConfirmation');

    const html = await render(AwaitingConfirmation({
      orderId: order.OrderID,
      customerName: order.CustomerName,
      tourName: tour?.name || order.TourID,
      tourSubtitle: tour?.subtitle || '',
      travelDate: order.TravelDate,
      returnDate: order.ReturnDate,
      departureTime: order.DepartureTime,
      guestDetails,
      guestCountsStr: order.Guests,
      amount: order.Amount,
      adultPrice: tour?.adultPrice || 0,
      childPrice: tour?.childPrice || 0,
      infantPrice: tour?.infantPrice || 0,
    }));

    return await send(`Booking Received - ${orderId}`, html, order.Email);
  } catch (error) {
    console.error('[Email] Failed to send Booking Received:', error);
    return false;
  }
}

/** "Your Booking Is Confirmed" - sent after a successful card payment or a manual confirmation. */
export async function sendBookingConfirmedEmail(orderId: string, amountOverride?: string): Promise<boolean> {
  try {
    const context = await loadContext(orderId);
    if (!context) return false;

    const { order, tour, guestDetails } = context;
    const { render } = await import('@react-email/render');
    const { BookingReceipt } = await import('@/components/emails/BookingReceipt');

    const html = await render(BookingReceipt({
      orderId: order.OrderID,
      tourName: tour?.name || order.TourID,
      tourSubtitle: tour?.subtitle || '',
      travelDate: order.TravelDate,
      returnDate: order.ReturnDate,
      departureTime: order.DepartureTime,
      hotelPickup: order.HotelPickup,
      guestDetails,
      guestCountsStr: order.Guests,
      amount: amountOverride || order.Amount,
      adultPrice: tour?.adultPrice || 0,
      childPrice: tour?.childPrice || 0,
      infantPrice: tour?.infantPrice || 0,
    }));

    return await send(`Booking Confirmed - ${orderId}`, html, order.Email);
  } catch (error) {
    console.error('[Email] Failed to send Booking Confirmed:', error);
    return false;
  }
}
