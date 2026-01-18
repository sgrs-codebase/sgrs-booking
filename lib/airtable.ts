import Airtable from 'airtable';

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
    return true;
  } catch (error) {
    console.error('Airtable Update Error:', error);
    return false;
  }
}

// ==========================================
// TOURS
// ==========================================

export async function getToursFromAirtable(): Promise<TourRecord[]> {
  try {
    const records = await base('Tours').select().all();
    
    return records.map(record => {
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
  } catch (error) {
    console.error('Airtable Get Tours Error:', error);
    return [];
  }
}
