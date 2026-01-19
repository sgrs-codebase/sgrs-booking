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
}

// ==========================================
// ORDERS
// ==========================================

export async function saveOrderToAirtable(order: OrderRecord) {
  try {
    await base('Orders').create([
      {
        fields: {
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
          FullGuestDetails: order.FullGuestDetails
        }
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
    };
  } catch (error) {
    console.error('Airtable Get Order Error:', error);
    return null;
  }
}

// ==========================================
// TOURS
// ==========================================

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
        notes: tour.notes
      }));
      // Even if fallback, we can cache it to avoid reprocessing
      cachedTours = fallbackTours;
      lastFetchTime = now;
      return fallbackTours;
    }

    const tours = records.map(record => {
      const includesRaw = (record.get('includes') as string) || '';
      const notesRaw = (record.get('notes') as string) || '';

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
        notes: notesRaw.split('\n').map(s => s.trim()).filter(Boolean)
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
      notes: tour.notes
    }));
  }
}
