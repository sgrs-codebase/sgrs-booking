# PROJECT CONTEXT: SAIGON RIVER STAR tour booking subdomain

## 1. Project Overview

This project is a specialized **Booking Web Application** hosted on a subdomain (e.g., `booking.saigonriverstar.com`). It serves as a bridge between the client's marketing site (Webflow) and the payment gateway (OnePay).

- **Primary Goal:** Allow users to book waterway tours seamlessly.
- **Key Constraint:** There is no traditional Backend/CMS. We use **Airtable** as the database and **Resend** for email notifications.
- **Flow:** Webflow (User Selects Tour) -> Next.js App (User Inputs Info) -> OnePay (Payment) -> Next.js (IPN Verification) -> Airtable + Email.

## 2. Tech Stack & Tools

- **Framework:** Next.js 14+ (App Router).
- **Language:** TypeScript (Strict mode).
- **Styling:** Tailwind CSS (Synced with Figma).
- **Forms:** React Hook Form + Zod (Validation).
- **Database:** `airtable` (Node.js library).
- **Payment:** OnePay (VPC Protocol - Redirect Method).
- **Email:** Resend SDK.
- **Design Source:** Figma (Accessed via MCP).

## 3. Architecture & Data Flow

### A. The Handoff (Webflow to App)

- **Source:** Webflow Button Link: `https://booking.saigonriverstar.com/?tourId=sunset-cruise`
- **Receiver:** Next.js Page (`page.tsx`) reads `searchParams.get('tourId')`.
- **Data Validation:** The App validates `tourId` against `Tours` table in Airtable (cached) via `/api/tours`. **Never trust price from URL.**

### B. The Payment Flow (OnePay Integration)

1.  **Client:** Submits Booking Form -> POST `/api/checkout`.
2.  **Server (/api/checkout):**
    - Fetches Tour data from Airtable to validate price.
    - Calculates `Total Amount` = (Adults * Price) + (Children * ChildPrice).
    - Creates "Pending" Order in Airtable.
    - Generates `vpc_SecureHash` using HMAC-SHA256 (Server-side only).
    - Returns OnePay Redirect URL.
3.  **OnePay:** User pays.
4.  **Server (/api/ipn):** OnePay triggers this webhook.
    - Verifies `vpc_SecureHash`.
    - Checks `vpc_TxnResponseCode == '0'`.
    - If Success: Update Order Status in Airtable -> Send Email.

### C. The "No-Code" CMS (Airtable)

- **Table Name:** `Orders`
- **Fields:** `OrderID`, `Timestamp`, `CustomerName`, `Phone`, `Email`, `TourID`, `Guests`, `Amount`, `PaymentStatus`, `OnePayRef`, `FullGuestDetails`.
- **Table Name:** `Tours`
- **Fields:** `id`, `name`, `subtitle`, `type`, `bookingType`, `duration`, `image`, `adultPrice`, `childPrice`, `infantPrice`, `includes`, `notes`.

## 4. Development Phases (Step-by-Step Guide)

### Phase 1: Setup & UI

**Goal:** Initialize project and build the Booking Form based on Figma.

- **Action:** Setup Next.js with Tailwind.
- **Action:** Connect Figma MCP to generate `BookingForm.tsx`.
- **Requirement:** Form must include: Full Name, Email, Phone, Date, Adults, Children.

### Phase 2: Logic & State

**Goal:** Handle URL parameters and dynamic pricing.

- **Action:** Create `lib/airtable.ts` and `/api/tours` to fetch tour data.
- **Action:** Create `usePriceCalculator` hook to update total price in real-time on the UI.

### Phase 3: OnePay Integration (Critical)

**Goal:** Securely generate payment URLs and handle returns.

- **Action:** Create `lib/onepay.ts` for hashing logic (HMAC-SHA256).
- **Action:** Implement `/api/checkout` to sign the request.
- **Action:** Implement `/api/ipn` to verify the response.
- **Rule:** Keys (`VPC_MERCHANT`, `ACCESS_CODE`, `HASH_SECRET`) must be in `.env`.

### Phase 4: Post-Payment (Airtable & Email)

**Goal:** Data persistence and notification.

- **Action:** Configure Airtable Base and API Key.
- **Action:** Create `lib/airtable.ts` to append/update rows.
- **Action:** Integration `resend` to send e-tickets.

## 5. Environment Variables Structure

_(Create .env.local based on this)_

```env
# App
NEXT_PUBLIC_BASE_URL=http://localhost:3000

# OnePay (Sandbox Config)
ONEPAY_MERCHANT=
ONEPAY_ACCESS_CODE=
ONEPAY_HASH_SECRET=
ONEPAY_URL=https://mtf.onepay.vn/paygate/vpcpay.op

# Airtable
AIRTABLE_API_KEY=
AIRTABLE_BASE_ID=

# Resend
RESEND_API_KEY=
ADMIN_EMAIL=
```
