import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';

// Initialize auth - see https://theoephraim.github.io/node-google-spreadsheet/#/guides/authentication
const serviceAccountAuth = new JWT({
  email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
  key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'), // Handle newlines in env var
  scopes: [
    'https://www.googleapis.com/auth/spreadsheets',
  ],
});

export const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID || '', serviceAccountAuth);

export interface OrderRow {
  OrderID: string;
  Timestamp: string;
  CustomerName: string;
  Email: string;
  Phone: string;
  TourID: string;
  Guests: string; // e.g., "2 Adults, 1 Child"
  Amount: string;
  PaymentStatus: string;
  OnePayRef: string;
  FullGuestDetails: string; // JSON string of all guest info
}

export async function saveOrderToSheet(order: OrderRow) {
  try {
    await doc.loadInfo();
    const sheet = doc.sheetsByTitle['Orders'];
    if (!sheet) throw new Error('Sheet "Orders" not found');

    await sheet.addRow({
      ...order,
      Timestamp: new Date().toISOString(),
    });
    console.log(`Order ${order.OrderID} saved to Google Sheets`);
    return true;
  } catch (error) {
    console.error('Google Sheets Save Error:', error);
    return false;
  }
}

export async function updateOrderStatus(orderId: string, status: string, onePayRef: string) {
  try {
    await doc.loadInfo();
    const sheet = doc.sheetsByTitle['Orders'];
    if (!sheet) throw new Error('Sheet "Orders" not found');

    // Fetch rows to find the order (this is inefficient for huge sheets, but fine for MVP)
    const rows = await sheet.getRows();
    const row = rows.find(r => r.get('OrderID') === orderId);

    if (row) {
      row.set('PaymentStatus', status);
      row.set('OnePayRef', onePayRef);
      await row.save();
      console.log(`Order ${orderId} updated to ${status}`);
      return true;
    } else {
      console.warn(`Order ${orderId} not found for update`);
      return false;
    }
  } catch (error) {
    console.error('Google Sheets Update Error:', error);
    return false;
  }
}
