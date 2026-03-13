import Airtable from 'airtable';
import { TOURS } from '@/lib/tours-data';

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
  TravelDate: string; // "YYYY-MM-DD"
  ReturnDate?: string; // "YYYY-MM-DD" (Optional)
  DepartureTime?: string; // "HH:mm" (Optional)
}

export interface TourRecord {
  id: string;
  name: string;
  subtitle: string;
  type: string;
  bookingType: string;
  duration: string;
  image: string;
  adultPrice: number;
  childPrice: number;
  infantPrice: number;
  includes: string[];
  notes: string[];
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

    await base('Orders').create([
      {
        fields: fields
      }
    ]);
    console.log(`Order ${order.OrderID} saved to Airtable`);
    return true;
  } catch (error) {
    console.error('Airtable Save Error:', error);
    return false;
  }
}

export async function updateOrderStatusAirtable(orderId: string, status: string, onePayRef: string) {
  try {
    // 1. Find the record first
    const records = await base('Orders').select({
      filterByFormula: `{OrderID} = '${orderId}'`,
      maxRecords: 1
    }).firstPage();

    if (records.length === 0) {
      console.warn(`Order ${orderId} not found in Airtable for update`);
      return false;
    }

    // 2. Update it
    await base('Orders').update([
      {
        id: records[0].id,
        fields: {
          PaymentStatus: status,
          OnePayRef: onePayRef
        }
      }
    ]);
    console.log(`Order ${orderId} updated to ${status} in Airtable`);
    return records[0]; // Return the full record so we can use it for emails
  } catch (error) {
    console.error('Airtable Update Error:', error);
    return false;
  }
}

export async function getOrderFromAirtable(orderId: string): Promise<OrderRecord | null> {
  try {
    const records = await base('Orders').select({
      filterByFormula: `{OrderID} = '${orderId}'`,
      maxRecords: 1
    }).firstPage();

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
      TravelDate: record.get('TravelDate') as string,
      ReturnDate: record.get('ReturnDate') as string,
      DepartureTime: record.get('DepartureTime') as string,
    };
  } catch (error) {
    console.error('Airtable Get Order Error:', error);
    return null;
  }
}

// Count bookings for a specific tour on a specific date
export async function countDailyBookings(tourId: string, travelDate: string): Promise<number> {
  try {
    const records = await base('Orders').select({
      filterByFormula: `AND({TourID} = '${tourId}', {TravelDate} = '${travelDate}')`,
    }).all();

    return records.length;
  } catch (error) {
    console.error('Airtable Count Daily Bookings Error:', error);
    return 0;
  }
}

// Generate OrderID in format: TOUR{number}.{ddMMyyyy}.{sequence}
// Example: TOUR1.27032026.001
export async function generateOrderId(tourId: string, travelDate: string): Promise<string> {
  // Map tour IDs to numbers
  const tourNumbers: Record<string, number> = {
    'cu-chi-tunnels': 1,
    'sunset-cruise': 2,
    'mekong-delta': 3,
  };

  const tourNumber = tourNumbers[tourId] || 1;

  // Format date as ddMMyyyy from YYYY-MM-DD string
  // Parse manually to avoid timezone issues
  const [year, month, day] = travelDate.split('-');
  const formattedDate = `${day}${month}${year}`;

  // Get current count for this tour on this date and increment
  const currentCount = await countDailyBookings(tourId, travelDate);
  const sequence = String(currentCount + 1).padStart(3, '0');

  return `TOUR${tourNumber}.${formattedDate}.${sequence}`;
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
    // Check cache first
    const now = Date.now();
    if (cachedTours && (now - lastFetchTime < CACHE_TTL)) {
      console.log('Using cached tours from Airtable');
      return cachedTours;
    }

    const records = await base('Tours').select().all();

    if (records.length === 0) {
      console.log('No tours found in Airtable, using local fallback');
      const fallbackTours = Object.values(TOURS).map(tour => ({
        id: tour.id,
        name: tour.name,
        subtitle: tour.subtitle,
        type: tour.type,
        bookingType: tour.bookingType,
        duration: tour.duration,
        image: tour.image,
        adultPrice: tour.adultPrice,
        childPrice: tour.childPrice,
        infantPrice: tour.infantPrice,
        includes: tour.includes,
        notes: tour.notes,
        notices: tour.notices && !tour.notices.trim().startsWith('<')
          ? convertPlainTextToHTML(tour.notices)
          : tour.notices,
        forceMajeure: tour.forceMajeure && !tour.forceMajeure.trim().startsWith('<')
          ? convertPlainTextToHTML(tour.forceMajeure)
          : tour.forceMajeure
      }));
      // Even if fallback, we can cache it to avoid reprocessing
      cachedTours = fallbackTours;
      lastFetchTime = now;
      return fallbackTours;
    }

    const tours = records.map(record => {
      const includesRaw = (record.get('includes') as string) || '';
      const notesRaw = (record.get('notes') as string) || '';
      const noticesRaw = (record.get('notices') as string) || '';
      const forceMajeureRaw = (record.get('forceMajeure') as string) || '';

      // Convert plain text to HTML if not already HTML
      const noticesHTML = noticesRaw && !noticesRaw.trim().startsWith('<')
        ? convertPlainTextToHTML(noticesRaw)
        : noticesRaw;

      const forceMajeureHTML = forceMajeureRaw && !forceMajeureRaw.trim().startsWith('<')
        ? convertPlainTextToHTML(forceMajeureRaw)
        : forceMajeureRaw;

      return {
        id: record.get('id') as string,
        name: record.get('name') as string,
        subtitle: record.get('subtitle') as string,
        type: record.get('type') as string,
        bookingType: record.get('bookingType') as string,
        duration: record.get('duration') as string,
        image: record.get('image') as string,
        adultPrice: Number(record.get('adultPrice')),
        childPrice: Number(record.get('childPrice')),
        infantPrice: Number(record.get('infantPrice')),
        includes: includesRaw.split('\n').map(s => s.trim()).filter(Boolean),
        notes: notesRaw.split('\n').map(s => s.trim()).filter(Boolean),
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
    // Fallback to local data on error
    console.log('Using local tour data fallback due to error');
    // We can also cache this fallback result if we want to avoid repeated errors quickly
    return Object.values(TOURS).map(tour => ({
      id: tour.id,
      name: tour.name,
      subtitle: tour.subtitle,
      type: tour.type,
      bookingType: tour.bookingType,
      duration: tour.duration,
      image: tour.image,
      adultPrice: tour.adultPrice,
      childPrice: tour.childPrice,
      infantPrice: tour.infantPrice,
      includes: tour.includes,
      notes: tour.notes,
      notices: tour.notices && !tour.notices.trim().startsWith('<')
        ? convertPlainTextToHTML(tour.notices)
        : tour.notices,
      forceMajeure: tour.forceMajeure && !tour.forceMajeure.trim().startsWith('<')
        ? convertPlainTextToHTML(tour.forceMajeure)
        : tour.forceMajeure
    }));
  }
}
