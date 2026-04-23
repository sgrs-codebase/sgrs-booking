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

// Generate OrderID in format: WEB.TOUR.YYMMDD.NNN
// Example: WEB.CCBD.260501.001
export async function generateOrderId(tourId: string, travelDate: string): Promise<string> {
  // Map common tour IDs to abbreviations
  const tourCodes: Record<string, string> = {
    'cu-chi-binh-duong': 'CCBD',
    'sunset-cruise': 'SC',
    'mekong-delta': 'MD',
  };

  // Get tour code or fallback to first 4 chars of ID uppercase
  const tourCode = tourCodes[tourId] || tourId.substring(0, 4).toUpperCase();

  // Format date as YYMMDD from YYYY-MM-DD string
  const [year, month, day] = travelDate.split('-');
  const formattedDate = `${year.substring(2)}${month}${day}`;

  const prefix = `WEB.${tourCode}.${formattedDate}.`;

  try {
    // Search for the highest sequence number for this specific tour and date
    // We search for records where OrderID starts with our prefix
    const records = await base('Orders').select({
      filterByFormula: `FIND('${prefix}', {OrderID}) = 1`,
      sort: [{ field: 'OrderID', direction: 'desc' }],
      maxRecords: 1
    }).firstPage();

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
