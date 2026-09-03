import Airtable from 'airtable';
import { TOURS } from '@/lib/tours-data';
import { airtableSafe } from '@/lib/airtable-safe';

// Initialize Airtable
// API Key and Base ID should be in .env.local
const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID || '');

// Interface matches our Order structure
export interface OrderRecord {
  OrderID: string;
  Timestamp: string;
  CustomerName: string;
  Email: string;
  Phone: string;
  TourID: string;
  Guests: string;
  Amount: string;
  PaymentStatus: string;
  OnePayRef: string;
  FullGuestDetails: string; // JSON string
  HotelPickup?: string; // Pick-up address, or "NO TRANSFER SERVICE" when left blank
  TravelDate: string; // "YYYY-MM-DD"
  ReturnDate?: string; // "YYYY-MM-DD" (Optional)
  DepartureTime?: string; // "HH:mm" (Optional)
  booking_status?: 'awaiting_confirmation' | 'confirmed' | 'cancelled';
  payment_status?: 'pending' | 'paid' | 'failed';
  Adults?: number;
  Children?: number;
  Infants?: number;
  created_at?: string;
}


export interface TourDateRecord {
  id?: string;
  tourId: string;
  date: string;
  departure_time?: string;
  date_type: 'pre-set' | 'default';
  total_slots: number;
}

export interface TourRecord {
  id: string;
  name: string;
  subtitle: string;
  type: string;
  bookingType: string;
  duration: string;
  image: string;
  codeName?: string;
  adultPrice: number;
  childPrice: number;
  infantPrice: number;
  includes: string[];
  notes: string[];
  startTimes?: string[];
  notices?: string;
  forceMajeure?: string;
}

// ==========================================
// ORDERS
// ==========================================

export async function saveOrderToAirtable(order: OrderRecord) {
  try {
    const fields: Record<string, string | number | boolean> = {
      OrderID: order.OrderID,
      Timestamp: order.Timestamp,
      CustomerName: order.CustomerName,
      Email: order.Email,
      Phone: order.Phone,
      TourID: order.TourID,
      Guests: order.Guests,
      Amount: order.Amount,
      PaymentStatus: order.PaymentStatus,
      OnePayRef: order.OnePayRef,
      FullGuestDetails: order.FullGuestDetails,
      HotelPickup: order.HotelPickup || 'NO TRANSFER SERVICE',
      TravelDate: order.TravelDate
    };

    // Only add ReturnDate if it exists and is not empty
    // Sending an empty string to a Date field in Airtable causes an error
    if (order.ReturnDate) {
      fields.ReturnDate = order.ReturnDate;
    }

    if (order.DepartureTime) {
      fields.DepartureTime = order.DepartureTime;
    }

    if (order.booking_status) {
      fields.booking_status = order.booking_status;
    }

    if (order.payment_status) {
      fields.payment_status = order.payment_status;
    }

    if (order.Adults !== undefined) fields.Adults = order.Adults;
    if (order.Children !== undefined) fields.Children = order.Children;
    if (order.Infants !== undefined) fields.Infants = order.Infants;

    await airtableSafe(null, () => base('Orders').create([
      {
        fields: fields
      }
    ]));
    console.log(`Order ${order.OrderID} saved to Airtable`);
    return true;
  } catch (error) {
    console.error('Airtable Save Error:', error);
    return false;
  }
}

export async function updateOrderStatusAirtable(orderId: string, status: string, onePayRef: string, bookingStatus?: string) {
  try {
    // 1. Find the record first
    const records = await airtableSafe(`order-${orderId}`, () => base('Orders').select({
      filterByFormula: `{OrderID} = '${orderId}'`,
      maxRecords: 1
    }).firstPage());

    if (records.length === 0) {
      console.warn(`Order ${orderId} not found in Airtable for update`);
      return false;
    }

    const fields: Record<string, string | number | boolean> = {
      PaymentStatus: status, // Backward compatibility
      payment_status: status.toLowerCase() === 'paid' ? 'paid' : (status.toLowerCase() === 'failed' ? 'failed' : 'pending'),
      OnePayRef: onePayRef
    };

    if (bookingStatus) {
      fields.booking_status = bookingStatus;
    }


    // 2. Update it
    await airtableSafe(null, () => base('Orders').update([
      {
        id: records[0].id,
        fields: fields
      }
    ]));
    console.log(`Order ${orderId} updated to ${status} in Airtable`);
    return records[0]; // Return the full record so we can use it for emails
  } catch (error) {
    console.error('Airtable Update Error:', error);
    return false;
  }
}

/**
 * Records the outcome of SGRS manually checking a bank transfer.
 * A rejected order stops occupying its slots (see occupiesSlotsFormula).
 */
export async function setOrderDecision(orderId: string, decision: 'confirm' | 'reject') {
  try {
    const records = await airtableSafe(null, () => base('Orders').select({
      filterByFormula: `{OrderID} = '${orderId}'`,
      maxRecords: 1
    }).firstPage(), 3, false);

    if (records.length === 0) {
      console.warn(`[Decision] Order ${orderId} not found in Airtable`);
      return false;
    }

    const fields = decision === 'confirm'
      ? { PaymentStatus: 'Paid', payment_status: 'paid', booking_status: 'confirmed' }
      : { PaymentStatus: 'Cancelled', payment_status: 'failed', booking_status: 'cancelled' };

    await airtableSafe(null, () => base('Orders').update([
      { id: records[0].id, fields }
    ]));

    console.log(`[Decision] Order ${orderId} marked as ${decision}`);
    return true;
  } catch (error) {
    console.error('Airtable Set Decision Error:', error);
    return false;
  }
}

export async function getOrderFromAirtable(orderId: string): Promise<OrderRecord | null> {
  try {
    const records = await airtableSafe(`order-${orderId}`, () => base('Orders').select({
      filterByFormula: `{OrderID} = '${orderId}'`,
      maxRecords: 1
    }).firstPage());

    if (records.length === 0) return null;

    const record = records[0];
    return {
      OrderID: record.get('OrderID') as string,
      Timestamp: record.get('Timestamp') as string,
      CustomerName: record.get('CustomerName') as string,
      Email: record.get('Email') as string,
      Phone: record.get('Phone') as string,
      TourID: record.get('TourID') as string,
      Guests: record.get('Guests') as string,
      Amount: record.get('Amount') as string,
      PaymentStatus: record.get('PaymentStatus') as string,
      OnePayRef: record.get('OnePayRef') as string,
      FullGuestDetails: record.get('FullGuestDetails') as string,
      HotelPickup: record.get('HotelPickup') as string,
      TravelDate: record.get('TravelDate') as string,
      ReturnDate: record.get('ReturnDate') as string,
      DepartureTime: record.get('DepartureTime') as string,
      booking_status: record.get('booking_status') as OrderRecord['booking_status'],
      payment_status: record.get('payment_status') as OrderRecord['payment_status'],
      Adults: record.get('Adults') as number,
      Children: record.get('Children') as number,
      Infants: record.get('Infants') as number,
    };

  } catch (error) {
    console.error('Airtable Get Order Error:', error);
    return null;
  }
}

// ==========================================
// TOUR DATES
// ==========================================

export async function getTourDate(tourId: string, date: string, time?: string, useCache = true): Promise<TourDateRecord | null> {
  try {
    // Use DATETIME_FORMAT to ensure robust date comparison in Airtable
    let formula = `AND({tourId} = '${tourId}', IS_SAME({date}, '${date}', 'day'))`;
    
    if (time) {
      formula = `AND({tourId} = '${tourId}', IS_SAME({date}, '${date}', 'day'), {departure_time} = '${time}')`;
    }

    const records = await airtableSafe(`tour-date-${tourId}-${date}-${time || 'any'}`, () => base('TourDates').select({
      filterByFormula: formula,
      maxRecords: 1
    }).firstPage(), 3, useCache);

    if (records.length === 0) return null;

    const record = records[0];
    return {
      id: record.id,
      tourId: record.get('tourId') as string,
      date: record.get('date') as string,
      departure_time: record.get('departure_time') as string,
      date_type: record.get('date_type') as 'pre-set' | 'default',
      total_slots: Number(record.get('total_slots') || 35),
    };
  } catch (error) {
    console.error('Airtable Get TourDate Error:', error);
    return null;
  }
}

export async function createTourDate(tourDate: TourDateRecord): Promise<TourDateRecord | null> {
  try {
    const records = await airtableSafe(null, () => base('TourDates').create([
      {
        fields: {
          tourId: tourDate.tourId,
          date: tourDate.date,
          date_type: tourDate.date_type,
          total_slots: tourDate.total_slots,
        }
      }
    ]));

    if (records.length === 0) return null;

    return {
      id: records[0].id,
      tourId: records[0].get('tourId') as string,
      date: records[0].get('date') as string,
      date_type: records[0].get('date_type') as 'pre-set' | 'default',
      total_slots: Number(records[0].get('total_slots') || 35),
    };
  } catch (error) {
    console.error('Airtable Create TourDate Error:', error);
    return null;
  }
}

// ==========================================
// SLOT HOLDING
// ==========================================

// A card (OnePay) order only holds its slots while the payment session is alive.
export const CARD_HOLD_MINUTES = Number(process.env.CARD_SLOT_HOLD_MINUTES || 30);

// A bank-transfer (QR) order is verified by hand, so it must keep its slots until
// SGRS confirms or rejects it. This cap only exists so an abandoned order eventually
// frees the seats on its own.
export const QR_HOLD_HOURS = Number(process.env.QR_SLOT_HOLD_HOURS || 72);

// Marker written by the checkout route for bank-transfer orders
const QR_PAYMENT_STATUS = 'QR Pending';

/**
 * Airtable formula fragment for "this order currently occupies its slots":
 * paid, or still within the hold window for its payment method.
 * Orders rejected by SGRS become 'failed'/'cancelled' and drop out here.
 */
function occupiesSlotsFormula(): string {
  const cardCutoff = new Date(Date.now() - CARD_HOLD_MINUTES * 60 * 1000).toISOString();
  const qrCutoff = new Date(Date.now() - QR_HOLD_HOURS * 60 * 60 * 1000).toISOString();

  return `OR(
        {payment_status} = 'paid',
        AND(
          {payment_status} = 'pending',
          {PaymentStatus} = '${QR_PAYMENT_STATUS}',
          IS_AFTER({created_at}, '${qrCutoff}')
        ),
        AND(
          {payment_status} = 'pending',
          {PaymentStatus} != '${QR_PAYMENT_STATUS}',
          IS_AFTER({created_at}, '${cardCutoff}')
        )
      )`;
}

export async function getOrdersByEmailAndDate(email: string, date: string, useCache = false): Promise<OrderRecord[]> {
  try {
    // Same email + same travel date, limited to orders that still hold their slots
    // Use IS_SAME for robust date comparison
    const records = await airtableSafe(null, () => base('Orders').select({
      filterByFormula: `AND(
        {Email} = '${email}', 
        IS_SAME({TravelDate}, '${date}', 'day'),
        ${occupiesSlotsFormula()}
      )`
    }).all(), 3, useCache);



    return records.map(record => ({
      OrderID: record.get('OrderID') as string,
      Timestamp: record.get('Timestamp') as string,
      CustomerName: record.get('CustomerName') as string,
      Email: record.get('Email') as string,
      Phone: record.get('Phone') as string,
      TourID: record.get('TourID') as string,
      Guests: record.get('Guests') as string,
      Amount: record.get('Amount') as string,
      PaymentStatus: record.get('PaymentStatus') as string,
      OnePayRef: record.get('OnePayRef') as string,
      FullGuestDetails: record.get('FullGuestDetails') as string,
      TravelDate: record.get('TravelDate') as string,
      booking_status: record.get('booking_status') as OrderRecord['booking_status'],
      payment_status: record.get('payment_status') as OrderRecord['payment_status'],
    }));

  } catch (error) {
    console.error('Airtable Get Orders by Email Error:', error);
    return [];
  }
}

export async function getOrdersByTourAndDate(tourId: string, date: string, time?: string, useCache = true): Promise<OrderRecord[]> {
  try {
    const occupies = occupiesSlotsFormula();

    let formula = `AND(
        {TourID} = '${tourId}', 
        IS_SAME({TravelDate}, '${date}', 'day'),
        ${occupies}
      )`;

    if (time) {
      formula = `AND(
        {TourID} = '${tourId}', 
        IS_SAME({TravelDate}, '${date}', 'day'),
        {DepartureTime} = '${time}',
        ${occupies}
      )`;
    }

    const records = await airtableSafe(`orders-${tourId}-${date}-${time || 'any'}`, () => base('Orders').select({
      filterByFormula: formula
    }).all(), 3, useCache);




    return records.map(record => ({
      OrderID: record.get('OrderID') as string,
      Timestamp: record.get('Timestamp') as string,
      CustomerName: record.get('CustomerName') as string,
      Email: record.get('Email') as string,
      Phone: record.get('Phone') as string,
      TourID: record.get('TourID') as string,
      Guests: record.get('Guests') as string,
      Amount: record.get('Amount') as string,
      PaymentStatus: record.get('PaymentStatus') as string,
      OnePayRef: record.get('OnePayRef') as string,
      FullGuestDetails: record.get('FullGuestDetails') as string,
      TravelDate: record.get('TravelDate') as string,
      Adults: Number(record.get('Adults') || 0),
      Children: Number(record.get('Children') || 0),
      Infants: Number(record.get('Infants') || 0),
      booking_status: record.get('booking_status') as OrderRecord['booking_status'],
      payment_status: record.get('payment_status') as OrderRecord['payment_status'],
    }));

  } catch (error) {
    console.error('Airtable Get Orders by Tour Error:', error);
    return [];
  }
}

export async function calculateAvailableSlots(tourId: string, date: string, time?: string, useCache = true): Promise<{ total: number, available: number, exists: boolean }> {
  const tourDate = await getTourDate(tourId, date, time, useCache);
  
  if (!tourDate) {
    return { total: 0, available: 0, exists: false };
  }

  const totalSlots = tourDate.total_slots;
  const orders = await getOrdersByTourAndDate(tourId, date, time, useCache);

  const bookedSlots = orders.reduce((sum, order) => {
    return sum + (order.Adults || 0) + (order.Children || 0);
  }, 0);

  return {
    total: totalSlots,
    available: Math.max(0, totalSlots - bookedSlots),
    exists: true
  };
}

export async function getOpenTourDates(tourId: string): Promise<TourDateRecord[]> {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];

    const records = await airtableSafe(`open-dates-${tourId}`, () => base('TourDates').select({
      filterByFormula: `AND({tourId} = '${tourId}', OR(IS_SAME({date}, '${todayStr}', 'day'), IS_AFTER({date}, '${todayStr}')))`,
      sort: [{ field: 'date', direction: 'asc' }]
    }).all(), 3, true);

    return records.map(record => ({
      id: record.id,
      tourId: record.get('tourId') as string,
      // Normalize Airtable date values so client-side calendar keys match YYYY-MM-DD exactly.
      date: String(record.get('date') || '').split('T')[0],
      departure_time: record.get('departure_time') as string,
      date_type: record.get('date_type') as 'pre-set' | 'default',
      total_slots: Number(record.get('total_slots') || 35),
    }));
  } catch (error) {
    console.error('Airtable Get Open Dates Error:', error);
    return [];
  }
}


// Generate OrderID in format: WEB.TOUR.YYMMDD.NNN
// Example: WEB.CCBD.260501.001
export async function generateOrderId(tourId: string, travelDate: string): Promise<string> {
  let tourCode = tourId.substring(0, 4).toUpperCase(); // Default fallback
  
  try {
    const tours = await getToursFromAirtable();
    const tour = tours.find(t => t.id === tourId);
    if (tour && tour.codeName) {
      tourCode = tour.codeName.toUpperCase();
    } else {
      console.warn(`No codeName found for tour ${tourId}, using fallback: ${tourCode}`);
    }
  } catch (error) {
    console.error('Error fetching tour for codeName:', error);
  }

  // Format date as YYMMDD from YYYY-MM-DD string
  const [year, month, day] = travelDate.split('-');
  const formattedDate = `${year.substring(2)}${month}${day}`;

  const prefix = `WEB.${tourCode}.${formattedDate}.`;

  try {
    // Search for the highest sequence number for this specific tour and date
    // We search for records where OrderID starts with our prefix
    const records = await airtableSafe(null, () => base('Orders').select({
      filterByFormula: `FIND('${prefix}', {OrderID}) = 1`,
      sort: [{ field: 'OrderID', direction: 'desc' }],
      maxRecords: 1
    }).firstPage());

    let nextNumber = 1;

    if (records.length > 0) {
      const lastOrderId = records[0].get('OrderID') as string;
      const parts = lastOrderId.split('.');
      const lastSequenceStr = parts[parts.length - 1];
      const lastNumber = parseInt(lastSequenceStr, 10);
      
      if (!isNaN(lastNumber)) {
        nextNumber = lastNumber + 1;
      }
    }

    const sequenceNumber = nextNumber.toString().padStart(3, '0');
    return `${prefix}${sequenceNumber}`;
  } catch (error) {
    console.error('Airtable Generate OrderID Error:', error);
    // Fallback: Use timestamp to ensure uniqueness if Airtable query fails
    const timestamp = Date.now().toString().slice(-3);
    return `${prefix}${timestamp}`;
  }
}


// ==========================================
// TOURS
// ==========================================

// Convert plain text with bullet points to HTML
// Supports:
// - Lines starting with "- " or "* " or "\- " become list items
// - Lines starting with "  - " or "  * " or "  \- " (2 spaces) become nested list items
// - Regular lines become paragraphs
// - Empty lines are preserved as spacing
function convertPlainTextToHTML(text: string): string {
  if (!text) return '';

  const lines = text.split('\n');
  const html: string[] = [];
  let inList = false;
  let inNestedList = false;
  let lastWasRegularItem = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Empty line
    if (!trimmed) {
      if (inNestedList) {
        html.push('    </ul>');
        html.push('  </li>');
        inNestedList = false;
      }
      if (inList) {
        html.push('</ul>');
        inList = false;
      }
      html.push('<br />');
      lastWasRegularItem = false;
      continue;
    }

    // Nested list item (starts with 2+ spaces and - or * or \-)
    if (/^  \\?[-*]\s/.test(line)) {
      const content = line.replace(/^  \\?[-*]\s/, '').trim();

      if (!inList) {
        html.push('<ul>');
        inList = true;
      }

      // If last item was a regular item, nest inside it
      // Otherwise, close previous nested list and start fresh
      if (!inNestedList) {
        if (lastWasRegularItem) {
          // Remove the closing </li> tag from the previous item
          const lastIndex = html.length - 1;
          if (html[lastIndex].trim() === '</li>') {
            html.pop();
          }
        }
        html.push('    <ul>');
        inNestedList = true;
      }

      html.push(`      <li>${content}</li>`);
      lastWasRegularItem = false;
      continue;
    }

    // Regular list item (starts with - or * or \-)
    if (/^\\?[-*]\s/.test(trimmed)) {
      const content = trimmed.replace(/^\\?[-*]\s/, '');

      if (inNestedList) {
        html.push('    </ul>');
        html.push('  </li>');
        inNestedList = false;
      }

      if (!inList) {
        html.push('<ul>');
        inList = true;
      }

      html.push(`  <li>${content}</li>`);
      lastWasRegularItem = true;
      continue;
    }

    // Regular paragraph
    if (inNestedList) {
      html.push('    </ul>');
      html.push('  </li>');
      inNestedList = false;
    }
    if (inList) {
      html.push('</ul>');
      inList = false;
    }

    html.push(`<p class="no-bullet">${trimmed}</p>`);
    lastWasRegularItem = false;
  }

  // Close any remaining open tags
  if (inNestedList) {
    html.push('    </ul>');
    if (lastWasRegularItem) {
      html.push('  </li>');
    }
  }
  if (inList) {
    html.push('</ul>');
  }

  return html.join('\n');
}

// Simple in-memory cache for tours (shared across the server instance)
let cachedTours: TourRecord[] | null = null;
let lastFetchTime = 0;
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes (increased since tour data is static)

export async function getToursFromAirtable(): Promise<TourRecord[]> {
  try {
    // Check if keys are available
    if (!process.env.AIRTABLE_API_KEY || !process.env.AIRTABLE_BASE_ID) {
      console.error('Airtable keys missing in environment variables');
      return [];
    }

    // Check cache first
    const now = Date.now();
    if (cachedTours && (now - lastFetchTime < CACHE_TTL)) {
      console.log('Using cached tours from Airtable');
      return cachedTours;
    }

    const records = await base('Tours').select().all();

    if (records.length === 0) {
      console.warn('No tours found in Airtable');
      return [];
    }

    const tours = records.map(record => {
      // Helper to get field value case-insensitively or with spaces
      const getField = (name: string) => {
        return record.get(name) || record.get(name.charAt(0).toUpperCase() + name.slice(1)) || record.get(name.replace(/([A-Z])/g, ' $1').trim());
      };

      const includesRaw = (getField('includes') as string) || '';
      const notesRaw = (getField('notes') as string) || '';
      const startTimesRaw = (getField('startTime') as string) || (getField('startTimes') as string) || '';
      const noticesRaw = (getField('notices') as string) || '';
      const forceMajeureRaw = (getField('forceMajeure') as string) || '';

      // Convert plain text to HTML if not already HTML
      const noticesHTML = noticesRaw && !noticesRaw.trim().startsWith('<')
        ? convertPlainTextToHTML(noticesRaw)
        : noticesRaw;

      const forceMajeureHTML = forceMajeureRaw && !forceMajeureRaw.trim().startsWith('<')
        ? convertPlainTextToHTML(forceMajeureRaw)
        : forceMajeureRaw;

      return {
        id: getField('id') as string,
        name: getField('name') as string,
        subtitle: getField('subtitle') as string,
        type: getField('type') as string,
        bookingType: getField('bookingType') as string,
        duration: getField('duration') as string,
        image: getField('image') as string,
        codeName: getField('codeName') as string,
        adultPrice: Number(getField('adultPrice') || 0),
        childPrice: Number(getField('childPrice') || 0),
        infantPrice: Number(getField('infantPrice') || 0),
        includes: includesRaw.split('\n').map(s => s.trim()).filter(Boolean),
        notes: notesRaw.split('\n').map(s => s.trim()).filter(Boolean),
        startTimes: startTimesRaw ? startTimesRaw.split(/[\n,]+/).map(s => s.trim()).filter(Boolean) : undefined,
        notices: noticesHTML || undefined,
        forceMajeure: forceMajeureHTML || undefined
      };
    });

    // Update cache
    cachedTours = tours;
    lastFetchTime = now;

    return tours;
  } catch (error) {
    console.error('Airtable Get Tours Error:', error);
    return [];
  }
}
