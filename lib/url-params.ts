/**
 * URL Parameters Helper
 * Parse and validate URL params from Webflow or other sources
 */

export interface BookingParams {
  tourId?: string;
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  promoCode?: string;
  utm_source?: string;
  utm_campaign?: string;
  utm_medium?: string;
  referrer?: string;
}

/**
 * Parse URL search params into structured booking params
 * @param searchParams - Next.js useSearchParams() result
 * @returns Validated booking parameters
 */
export function parseBookingParams(searchParams: URLSearchParams): BookingParams {
  const params: BookingParams = {};

  // Tour ID (required)
  const tourId = searchParams.get('tourId');
  if (tourId) params.tourId = tourId;

  // Pre-fill customer info (optional)
  const email = searchParams.get('email');
  if (email && isValidEmail(email)) params.email = email;

  const phone = searchParams.get('phone');
  if (phone) params.phone = sanitizePhone(phone);

  const firstName = searchParams.get('firstName') || searchParams.get('firstname');
  if (firstName) params.firstName = sanitizeName(firstName);

  const lastName = searchParams.get('lastName') || searchParams.get('lastname');
  if (lastName) params.lastName = sanitizeName(lastName);

  // Promo code (optional)
  const promoCode = searchParams.get('promo') || searchParams.get('promoCode');
  if (promoCode) params.promoCode = promoCode.toUpperCase();

  // UTM tracking (optional - for analytics)
  const utm_source = searchParams.get('utm_source');
  if (utm_source) params.utm_source = utm_source;

  const utm_campaign = searchParams.get('utm_campaign');
  if (utm_campaign) params.utm_campaign = utm_campaign;

  const utm_medium = searchParams.get('utm_medium');
  if (utm_medium) params.utm_medium = utm_medium;

  // Referrer (optional)
  const referrer = searchParams.get('ref') || searchParams.get('referrer');
  if (referrer) params.referrer = referrer;

  return params;
}

/**
 * Validate email format
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Sanitize phone number (remove special chars, keep only digits and +)
 */
function sanitizePhone(phone: string): string {
  return phone.replace(/[^\d+]/g, '');
}

/**
 * Sanitize name (remove special chars, only allow letters and spaces)
 */
function sanitizeName(name: string): string {
  return name
    .trim()
    .replace(/[^a-zA-Z\s]/g, '')
    .substring(0, 50); // Limit length
}

/**
 * Build URL with params for Webflow
 * @param baseUrl - Base booking URL
 * @param params - Booking parameters
 * @returns Full URL with query string
 */
export function buildBookingUrl(baseUrl: string, params: BookingParams): string {
  const url = new URL(baseUrl);
  
  Object.entries(params).forEach(([key, value]) => {
    if (value) {
      url.searchParams.set(key, value.toString());
    }
  });

  return url.toString();
}

/**
 * Example usage in Webflow:
 * 
 * const bookingUrl = buildBookingUrl('https://booking.saigonriverstar.com', {
 *   tourId: 'sunset-cruise',
 *   email: 'customer@example.com',
 *   promoCode: 'SUMMER2026',
 *   utm_source: 'facebook',
 *   utm_campaign: 'summer_sale'
 * });
 * 
 * Result: 
 * https://booking.saigonriverstar.com?tourId=sunset-cruise&email=customer@example.com&promoCode=SUMMER2026&utm_source=facebook&utm_campaign=summer_sale
 */
