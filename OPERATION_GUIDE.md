# 🚢 SAIGON RIVER STAR - Hướng Dẫn Vận Hành Project

## 📋 Mục Lục

1. [Tổng Quan Project](#1-tổng-quan-project)
2. [Cài Đặt & Setup](#2-cài-đặt--setup)
3. [Environment Variables](#3-environment-variables)
4. [Development Workflow](#4-development-workflow)
5. [Cấu Trúc Project](#5-cấu-trúc-project)
6. [Payment Flow (OnePay)](#6-payment-flow-onepay)
7. [Database (Airtable)](#7-database-airtable)
8. [API Endpoints](#8-api-endpoints)
9. [Troubleshooting](#9-troubleshooting)
10. [Deployment](#10-deployment)

---

## 1. Tổng Quan Project

### Mục Đích
Đây là **Booking Web Application** cho phép khách hàng đặt tour du thuyền trên sông Saigon.

### Tech Stack
- **Framework:** Next.js 14+ (App Router)
- **Language:** TypeScript
- **Styling:** SCSS + Tailwind CSS
- **Forms:** React Hook Form
- **Payment Gateway:** OnePay VPC Protocol
- **Database:** Airtable
- **Email Service:** Resend
- **Phone Validation:** react-international-phone + libphonenumber-js

### Luồng Hoạt Động
```
Webflow (Marketing Site)
    ↓ (User clicks "Book Tour" với tourId parameter)
Next.js App (Booking Form)
    ↓ (User fills info & submits)
POST /api/checkout (Generate OnePay URL)
    ↓ (Redirect to OnePay)
OnePay Payment Gateway
    ↓ (Payment Success/Fail)
POST /api/ipn (IPN Callback)
    ↓ (Verify signature & update Airtable)
Redirect to /booking/success hoặc /booking/failed
```

---

## 2. Cài Đặt & Setup

### Prerequisites
- **Node.js:** v18+ (recommended v20)
- **npm** hoặc **yarn**
- **Airtable Account** với Base đã setup
- **OnePay Merchant Account** (test hoặc production)
- **Resend API Key** (cho email)

### Bước 1: Clone & Install Dependencies

```bash
# Clone repository (nếu từ Git)
git clone <repository-url>
cd sgrs

# Install dependencies
npm install
```

### Bước 2: Tạo File Environment Variables

```bash
# Tạo file .env.local trong thư mục gốc
touch .env.local
```

Copy nội dung từ section [Environment Variables](#3-environment-variables) bên dưới.

### Bước 3: Start Development Server

```bash
# Start dev server (default port 3000)
npm run dev

# Nếu port 3000 bị chiếm, Next.js tự động chuyển sang port khác (3001, 3002...)
```

### Bước 4: Verify Setup

- Mở browser: `http://localhost:3000`
- Check console log không có error về env variables
- Thử booking flow để test

---

## 3. Environment Variables

Tạo file `.env.local` trong thư mục gốc với nội dung sau:

```env
# ========================================
# APP CONFIGURATION
# ========================================
NEXT_PUBLIC_BASE_URL=http://localhost:3000
# Production: NEXT_PUBLIC_BASE_URL=https://booking.saigonriverstar.com

# ========================================
# ONEPAY PAYMENT GATEWAY
# ========================================
# Test Environment (MTF)
ONEPAY_MERCHANT=TESTDEFAULT
ONEPAY_ACCESS_CODE=6BEB2546
ONEPAY_HASH_SECRET=6D0870CDE5F24F34F3915FB0045120DB
ONEPAY_URL=https://mtf.onepay.vn/paygate/vpcpay.op

# Production Environment (produksi)
# ONEPAY_MERCHANT=<your_merchant_id>
# ONEPAY_ACCESS_CODE=<your_access_code>
# ONEPAY_HASH_SECRET=<your_hash_secret>
# ONEPAY_URL=https://onepay.vn/paygate/vpcpay.op

# ========================================
# AIRTABLE DATABASE
# ========================================
AIRTABLE_API_KEY=<your_airtable_api_key>
AIRTABLE_BASE_ID=<your_base_id>

# Airtable Table Names (default)
# - Tours: Danh sách tour
# - Orders: Đơn hàng booking

# ========================================
# RESEND EMAIL SERVICE
# ========================================
RESEND_API_KEY=<your_resend_api_key>
ADMIN_EMAIL=admin@saigonriverstar.com
FROM_EMAIL=<verified_sender@your_domain>

# ========================================
# MANUAL BOOKING CONFIRMATION
# ========================================
# Secret cho POST /api/orders/<id>/decision (Airtable automation gọi vào)
ADMIN_WEBHOOK_SECRET=<random_secret>

# ========================================
# SLOT HOLD
# ========================================
QR_SLOT_HOLD_HOURS=72
CARD_SLOT_HOLD_MINUTES=30
```

### Cách Lấy Credentials

#### Airtable
1. Đăng nhập Airtable: https://airtable.com
2. Vào Base của bạn
3. Copy Base ID từ URL: `https://airtable.com/app{BASE_ID}/...`
4. Tạo API Key: https://airtable.com/create/tokens

#### OnePay
1. **Test Environment:** Dùng credentials trên (public test account)
2. **Production:** Liên hệ OnePay để đăng ký merchant account

#### Resend
1. Đăng ký tại https://resend.com
2. Tạo API Key trong Dashboard
3. Verify domain email của bạn

---

## 4. Development Workflow

### Khởi Động Development Server

```bash
# Normal start
npm run dev

# Nếu gặp port conflict
pkill -9 -f "next dev"  # Kill existing process
npm run dev

# Nếu gặp lock file error
rm -rf .next
npm run dev
```

### Build for Production

```bash
# Build production bundle
npm run build

# Start production server
npm run start
```

### Linting

```bash
npm run lint
```

### Key Development Commands

```bash
# Clear cache & restart
rm -rf .next && npm run dev

# Check ports in use
lsof -i :3000

# Kill process on specific port
kill -9 $(lsof -t -i:3000)
```

---

## 5. Cấu Trúc Project

```
sgrs/
├── app/                      # Next.js App Router
│   ├── globals.scss          # Global styles
│   ├── layout.tsx            # Root layout
│   ├── page.tsx              # Homepage
│   ├── api/                  # API Routes
│   │   ├── checkout/
│   │   │   └── route.ts      # Generate OnePay URL
│   │   ├── ipn/
│   │   │   └── route.ts      # OnePay IPN callback
│   │   └── tours/
│   │       └── route.ts      # Fetch tours từ Airtable
│   └── booking/
│       ├── page.tsx          # Booking form page
│       ├── success/
│       │   └── page.tsx      # Payment success page
│       └── failed/
│           └── page.tsx      # Payment failed page
│
├── components/
│   ├── features/
│   │   ├── BookingForm.tsx   # Main booking form (multi-step)
│   │   ├── BookingSteps.tsx  # Step indicator
│   │   ├── TourCard.tsx      # Tour display card
│   │   └── TripTotal.tsx     # Price summary
│   ├── layout/
│   │   └── Navbar.tsx        # Navigation bar
│   └── emails/
│       └── BookingReceipt.tsx # Email template
│
├── lib/                      # Core logic
│   ├── airtable.ts           # Airtable integration
│   ├── onepay.ts             # OnePay payment URL generation
│   ├── tours-data.ts         # Tour data types
│   └── google-sheets.ts      # (Optional) Google Sheets
│
├── styles/                   # SCSS modules
│   ├── main.scss
│   ├── abstracts/            # Variables, mixins
│   ├── base/                 # Reset, typography
│   ├── components/           # Component styles
│   └── layouts/              # Layout styles
│
├── types/                    # TypeScript types
├── public/                   # Static assets
│   ├── fonts/
│   └── images/
│       ├── flags/
│       └── tours/
│
├── .env.local                # Environment variables (DO NOT COMMIT)
├── next.config.ts            # Next.js configuration
├── tsconfig.json             # TypeScript configuration
├── package.json              # Dependencies
└── PROJECT_CONTEXT.md        # Project documentation
```

---

## 6. Payment Flow (OnePay)

### OnePay VPC Protocol Overview

OnePay sử dụng **VPC (Virtual Payment Client)** protocol:
- **Redirect Method:** User được redirect tới OnePay gateway
- **HMAC-SHA256 Signature:** Verify tính toàn vẹn của dữ liệu
- **IPN Callback:** OnePay gọi lại server sau khi thanh toán

### Flow Chi Tiết

#### Step 1: User Submit Booking Form
```typescript
// app/booking/page.tsx
const response = await fetch('/api/checkout', {
  method: 'POST',
  body: JSON.stringify({
    tourId,
    adults,
    children,
    infants,
    customerInfo,
    date,
    time,
    guests
  })
});

const { paymentUrl } = await response.json();
window.location.href = paymentUrl; // Redirect to OnePay
```

#### Step 2: Server Generate Payment URL
```typescript
// app/api/checkout/route.ts
import { buildPaymentUrl, OnePayParams } from '@/lib/onepay';

// 1. Validate tour & calculate amount
const tour = await fetchTourFromAirtable(tourId);
const amount = (adults * tour.adultPrice) + (children * tour.childPrice);

// 2. Create pending order in Airtable
await saveOrderToAirtable({ ...orderData, PaymentStatus: 'Pending' });

// 3. Build OnePay params
const params: OnePayParams = {
  vpc_AccessCode: process.env.ONEPAY_ACCESS_CODE,
  vpc_Amount: (amount * 100).toString(), // VND * 100
  vpc_Command: 'pay',
  vpc_Currency: 'VND',
  vpc_Locale: 'en',
  vpc_MerchTxnRef: orderId,
  vpc_Merchant: process.env.ONEPAY_MERCHANT,
  vpc_OrderInfo: `Booking ${tour.name}`,
  vpc_ReturnURL: `${process.env.NEXT_PUBLIC_BASE_URL}/api/ipn`,
  vpc_Version: '2',
  vpc_TicketNo: clientIp,
  // Custom params (user_ prefix)
  user_Customer_Email: customerInfo.email,
  user_Customer_Phone: customerInfo.phone,
};

// 4. Generate signed URL
const paymentUrl = buildPaymentUrl(params, process.env.ONEPAY_URL, process.env.ONEPAY_HASH_SECRET);

return { paymentUrl };
```

#### Step 3: OnePay Process Payment
User nhập thông tin thẻ trên trang OnePay.

#### Step 4: IPN Callback (Server Side)
```typescript
// app/api/ipn/route.ts
import { verify } from '@/lib/onepay';

// 1. Parse query params từ OnePay
const params = Object.fromEntries(searchParams);

// 2. Verify signature
const isValid = verify(params, process.env.ONEPAY_HASH_SECRET);
if (!isValid) {
  return NextResponse.redirect('/booking/failed?error=invalid_signature');
}

// 3. Check response code
const responseCode = params.vpc_TxnResponseCode;
const orderId = params.vpc_MerchTxnRef;

if (responseCode === '0') {
  // Success
  await updateOrderStatus(orderId, 'Paid', params.vpc_TransactionNo);
  await sendConfirmationEmail(orderId);
  return NextResponse.redirect('/booking/success');
} else {
  // Failed
  await updateOrderStatus(orderId, 'Failed');
  return NextResponse.redirect('/booking/failed');
}
```

### OnePay Signature Calculation

```typescript
// lib/onepay.ts
export function sign(params: Record<string, string>, secret: string): string {
  // 1. Filter params: only vpc_* and user_* (exclude vpc_SecureHash, vpc_SecureHashType, empty values)
  const keys = Object.keys(params)
    .filter(k => 
      (k.startsWith('vpc_') || k.startsWith('user_')) && 
      k !== 'vpc_SecureHash' && 
      k !== 'vpc_SecureHashType' && 
      params[k].length > 0
    )
    .sort();

  // 2. Build query string
  const queryString = keys.map(k => `${k}=${params[k]}`).join('&');

  // 3. HMAC-SHA256 hash
  const hmac = crypto.createHmac('sha256', Buffer.from(secret, 'hex'));
  hmac.update(queryString);
  return hmac.digest('hex').toUpperCase();
}
```

### Important Notes

1. **Param Prefixes:**
   - `vpc_*`: Standard VPC params (defined by OnePay)
   - `user_*`: Custom params (allowed by OnePay)
   - ❌ **DO NOT** use custom `vpc_*` params (like `vpc_Customer_Email`) - sẽ gây lỗi signature mismatch

2. **Amount Format:**
   - OnePay yêu cầu amount = **VND × 100**
   - Example: 500,000 VND → `50000000`

3. **Signature Sync:**
   - URL params phải **CHÍNH XÁC** match với params dùng để tính signature
   - Thứ tự params không quan trọng (đã sort), nhưng keys/values phải giống hệt

4. **Return URL:**
   - Phải là absolute URL (https://)
   - OnePay sẽ POST data tới URL này (IPN callback)

---

## 7. Database (Airtable)

### Airtable Base Structure

#### Table: `Tours`

| Field        | Type      | Description                    |
|--------------|-----------|--------------------------------|
| id           | Text      | Unique tour ID (slug)          |
| name         | Text      | Tour name                      |
| subtitle     | Text      | Short description              |
| type         | Text      | e.g., "Sunset Cruise"          |
| bookingType  | Text      | "Single Date" / "Multi Date"   |
| duration     | Text      | e.g., "2 hours"                |
| image        | Attachment| Tour thumbnail                 |
| adultPrice   | Number    | Adult price (VND)              |
| childPrice   | Number    | Child price (VND)              |
| infantPrice  | Number    | Infant price (VND)             |
| includes     | Long Text | What's included (JSON array)   |
| notes        | Long Text | Additional notes               |

#### Table: `Orders`

| Field             | Type      | Description                        |
|-------------------|-----------|------------------------------------|
| OrderID           | Text      | Unique order ID (auto-generated)   |
| Timestamp         | DateTime  | Order creation time                |
| CustomerName      | Text      | Full name                          |
| Email             | Email     | Customer email                     |
| Phone             | Phone     | Customer phone (international)     |
| TourID            | Text      | Reference to Tours.id              |
| Guests            | Text      | Summary (e.g., "2 Adults, 1 Child")|
| Amount            | Number    | Total amount (VND)                 |
| PaymentStatus     | Select    | "Pending" / "Paid" / "Failed"      |
| OnePayRef         | Text      | OnePay transaction ID              |
| FullGuestDetails  | Long Text | JSON array of guest info           |
| HotelPickup       | Text      | Pick-up address, or "NO TRANSFER SERVICE" if blank |
| TravelDate        | Date      | Departure date                     |
| ReturnDate        | Date      | Return date (optional)             |
| DepartureTime     | Text      | Departure time (e.g., "14:00")     |

### Integration Code

```typescript
// lib/airtable.ts
import Airtable from 'airtable';

const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY })
  .base(process.env.AIRTABLE_BASE_ID!);

// Fetch tours
export async function getToursFromAirtable(): Promise<Tour[]> {
  const records = await base('Tours').select().all();
  return records.map(record => ({
    id: record.get('id') as string,
    name: record.get('name') as string,
    adultPrice: record.get('adultPrice') as number,
    // ... other fields
  }));
}

// Save order
export async function saveOrderToAirtable(order: Order): Promise<void> {
  await base('Orders').create([
    {
      fields: {
        OrderID: order.OrderID,
        CustomerName: order.CustomerName,
        // ... other fields
      }
    }
  ]);
}

// Update order status
export async function updateOrderStatus(
  orderId: string, 
  status: string, 
  onePayRef?: string
): Promise<void> {
  const records = await base('Orders')
    .select({ filterByFormula: `{OrderID} = '${orderId}'` })
    .all();
  
  if (records.length > 0) {
    await base('Orders').update([
      {
        id: records[0].id,
        fields: {
          PaymentStatus: status,
          OnePayRef: onePayRef || '',
        }
      }
    ]);
  }
}
```

---

## 8. API Endpoints

### GET `/api/tours`

**Description:** Fetch all tours từ Airtable.

**Response:**
```json
{
  "tours": [
    {
      "id": "sunset-cruise",
      "name": "Sunset Cruise",
      "adultPrice": 500000,
      "childPrice": 250000,
      "infantPrice": 0
    }
  ]
}
```

### POST `/api/checkout`

**Description:** Create pending order và generate OnePay payment URL.

**Request Body:**
```json
{
  "tourId": "sunset-cruise",
  "adults": 2,
  "children": 1,
  "infants": 0,
  "customerInfo": {
    "firstName": "Nguyen",
    "lastName": "Van A",
    "email": "nguyenvana@example.com",
    "phone": "+84912345678"
  },
  "date": "2026-05-01",
  "returnDate": "2026-05-02",
  "time": "18:00",
  "guests": [
    {
      "firstName": "Nguyen",
      "lastName": "Van A",
      "dateOfBirth": "1990-01-01",
      "nationality": "Vietnam",
      "note": "Vegetarian"
    }
  ]
}
```

**Response:**
```json
{
  "paymentUrl": "https://mtf.onepay.vn/paygate/vpcpay.op?vpc_AccessCode=6BEB2546&vpc_Amount=125000000&..."
}
```

**Error Responses:**
- `400`: Invalid Tour ID hoặc Invalid Amount
- `500`: Payment Gateway Configuration Error

### GET `/api/ipn`

**Description:** OnePay IPN callback endpoint (được gọi bởi OnePay sau payment).

**Query Params:** (Sent by OnePay)
- `vpc_TxnResponseCode`: Response code ("0" = success)
- `vpc_MerchTxnRef`: Order ID
- `vpc_TransactionNo`: OnePay transaction ID
- `vpc_SecureHash`: Signature
- ... (other vpc_* params)

**Response:** Redirect to `/booking/success` hoặc `/booking/failed`

### POST `/api/orders/{orderId}/decision`

**Description:** Ghi nhận kết quả SGRS kiểm tra thủ công giao dịch chuyển khoản (QR).

**Headers:**
- `x-admin-secret`: giá trị của env `ADMIN_WEBHOOK_SECRET`

**Request Body:**
```json
{ "action": "confirm" }
```
hoặc
```json
{ "action": "reject" }
```

| action | Airtable | Email |
|---|---|---|
| `confirm` | `PaymentStatus=Paid`, `payment_status=paid`, `booking_status=confirmed` | Gửi "Your Booking Is Confirmed" cho khách |
| `reject` | `PaymentStatus=Cancelled`, `payment_status=failed`, `booking_status=cancelled` | Không gửi. Slot được nhả ngay |

**Idempotent:** đơn đã ở trạng thái cuối sẽ trả `alreadyProcessed: true` và không gửi lại email,
nên Airtable automation bắn trùng cũng an toàn.

**Error Responses:**
- `401`: Sai/thiếu `x-admin-secret`
- `404`: Không tìm thấy order
- `409`: Confirm một đơn đã bị cancel

---

## 8.1. Giữ Slot (Slot Hold)

Một đơn chiếm chỗ khi `payment_status = paid`, hoặc còn trong thời hạn giữ chỗ:

| Loại đơn | Nhận biết | Thời hạn giữ chỗ | Env |
|---|---|---|---|
| Thẻ quốc tế (OnePay) | `PaymentStatus != 'QR Pending'` | 30 phút kể từ `created_at` | `CARD_SLOT_HOLD_MINUTES` |
| Chuyển khoản (QR) | `PaymentStatus = 'QR Pending'` | 72 giờ kể từ `created_at` | `QR_SLOT_HOLD_HOURS` |

Đơn QR giữ chỗ lâu hơn vì cần SGRS đối soát thủ công. Khi SGRS `reject`, đơn chuyển sang
`failed/cancelled` và nhả chỗ ngay, không cần chờ hết 72 giờ. Logic nằm ở
`occupiesSlotsFormula()` trong `lib/airtable.ts`.

---

## 9. Troubleshooting

### 1. OnePay Error: `NG04002` (Angular Routing Error)

**Nguyên nhân:** OnePay signature verification failed.

**Giải pháp:**
1. Check params trong URL có match với params trong signature không
2. Đảm bảo chỉ dùng `vpc_*` (standard) và `user_*` (custom) params
3. ❌ Không dùng custom `vpc_*` params (e.g., `vpc_Customer_Email`)
4. Check secret key format: phải là **hex string** (64 chars)

**Debug:**
```typescript
// Thêm vào lib/onepay.ts
console.log('=== SIGNING ===');
console.log('Filtered keys:', keys);
console.log('Query string:', queryString);
console.log('Hash:', hash);
```

### 2. Port Already in Use

**Error:** `Port 3000 is in use`

**Giải pháp:**
```bash
# Option 1: Kill process
pkill -9 -f "next dev"

# Option 2: Kill specific port
kill -9 $(lsof -t -i:3000)

# Option 3: Use different port
npm run dev -- -p 3001
```

### 3. Lock File Error

**Error:** `Unable to acquire lock at .next/dev/lock`

**Giải pháp:**
```bash
rm -rf .next
npm run dev
```

### 4. Airtable API Error

**Error:** `AIRTABLE_API_KEY is not valid`

**Giải pháp:**
1. Verify API key tại https://airtable.com/create/tokens
2. Đảm bảo token có quyền truy cập Base
3. Check Base ID đúng format: `app{14_chars}`

### 5. Email Không Gửi

**Nguyên nhân:** Resend API key invalid hoặc domain chưa verify.

**Giải pháp:**
1. Verify domain trong Resend dashboard
2. Check `RESEND_API_KEY` trong `.env.local`
3. Test email với Resend test endpoint

### 6. Empty Note Field Causing Issues

**Nguyên nhân:** OnePay reject empty optional params.

**Giải pháp:** Đã fix - set default "None" cho empty Note field:
```typescript
// components/features/BookingForm.tsx
const guestsWithDefaults = guests.map(guest => ({
  ...guest,
  note: guest.note?.trim() || "None"
}));
```

### 7. CORS Errors

**Nguyên nhân:** Frontend gọi API từ domain khác.

**Giải pháp:** Next.js API routes không có CORS issue vì cùng origin. Nếu cần CORS:
```typescript
// next.config.ts
async headers() {
  return [
    {
      source: '/api/:path*',
      headers: [
        { key: 'Access-Control-Allow-Origin', value: '*' },
      ],
    },
  ];
}
```

---

## 10. Deployment

### Prerequisites
- **Hosting:** Vercel (recommended), Netlify, hoặc VPS
- **Domain:** Custom domain đã setup DNS
- **Environment Variables:** Production credentials

### Deploy lên Vercel

#### Step 1: Install Vercel CLI
```bash
npm install -g vercel
```

#### Step 2: Login
```bash
vercel login
```

#### Step 3: Deploy
```bash
# First deployment
vercel

# Production deployment  
vercel --prod
```

#### Step 4: Set Environment Variables

Trong Vercel Dashboard:
1. Settings → Environment Variables
2. Thêm tất cả vars từ `.env.local`
3. Set scope: Production / Preview / Development

#### Step 5: Custom Domain
1. Vercel Dashboard → Domains
2. Add domain: `booking.saigonriverstar.com`
3. Setup DNS records theo hướng dẫn

### Deploy lên VPS (Ubuntu)

```bash
# 1. Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 2. Install PM2
sudo npm install -g pm2

# 3. Clone & build
git clone <repo-url>
cd sgrs
npm install
npm run build

# 4. Create .env.local (production values)
nano .env.local

# 5. Start with PM2
pm2 start npm --name "sgrs" -- start
pm2 save
pm2 startup

# 6. Setup Nginx reverse proxy
sudo nano /etc/nginx/sites-available/booking.saigonriverstar.com
```

Nginx config:
```nginx
server {
    listen 80;
    server_name booking.saigonriverstar.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Enable site & restart Nginx
sudo ln -s /etc/nginx/sites-available/booking.saigonriverstar.com /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Setup SSL với Let's Encrypt
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d booking.saigonriverstar.com
```

### Post-Deployment Checklist

- [ ] Verify all environment variables được set đúng
- [ ] Test booking flow end-to-end
- [ ] Check OnePay integration (dùng test cards)
- [ ] Verify Airtable orders được tạo
- [ ] Test email confirmation gửi thành công
- [ ] Check responsive design trên mobile
- [ ] Setup monitoring (Vercel Analytics, Sentry, etc.)
- [ ] Configure custom domain DNS
- [ ] Enable HTTPS/SSL

---

## 📞 Support & Contact

Nếu gặp vấn đề không có trong guide này:

1. Check console logs (browser DevTools + terminal)
2. Review [PROJECT_CONTEXT.md](./PROJECT_CONTEXT.md) để hiểu architecture
3. Test từng component độc lập (tours API, OnePay signature, Airtable CRUD)
4. Contact OnePay support nếu payment gateway issues

---

## 🎯 Quick Reference

### Essential Commands
```bash
npm run dev          # Start development
npm run build        # Build production
npm run start        # Start production
npm run lint         # Run ESLint
rm -rf .next         # Clear cache
pkill -9 -f "next"   # Kill dev server
```

### Key Files
- `app/api/checkout/route.ts` - Payment URL generation
- `app/api/ipn/route.ts` - OnePay callback handler
- `lib/onepay.ts` - Signature calculation
- `lib/airtable.ts` - Database operations
- `components/features/BookingForm.tsx` - Main booking UI

### Test Credentials (OnePay MTF)
```
Merchant: TESTDEFAULT
Access Code: 6BEB2546
Hash Secret: 6D0870CDE5F24F34F3915FB0045120DB
URL: https://mtf.onepay.vn/paygate/vpcpay.op

Test Card:
- Number: 9704 0000 0000 0018
- Name: NGUYEN VAN A
- Date: 03/07
- OTP: otp
```

---

**Last Updated:** 16/04/2026  
**Version:** 1.0.0
