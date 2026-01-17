// ==========================================================================
// Tour Data - Source of Truth for Tour Information and Pricing
// ==========================================================================

export interface Tour {
  id: string;
  name: string;
  subtitle: string;
  type: 'Day-tour' | 'Multi-day' | 'Cruise';
  bookingType: 'day-tour' | 'overnight-tour';
  duration: string;
  image: string;
  adultPrice: number;
  childPrice: number;
  infantPrice: number;
  includes: string[];
  notes: string[];
}

export const TOURS: Record<string, Tour> = {
  'cu-chi-tunnels': {
    id: 'cu-chi-tunnels',
    name: 'Cu Chi Tunnels – Binh Duong Eco-tourism',
    subtitle: 'Unearthing Heritage, Embracing Nature',
    type: 'Day-tour',
    bookingType: 'day-tour',
    duration: '5 hours',
    image: '/images/tours/cu-chi-tunnels.png',
    adultPrice: 2500000,
    childPrice: 2125000,
    infantPrice: 0,
    includes: [
      'Refreshments Onboard: Enjoy pastries, local fruits, and a selection of beverages throughout your speedboat journey.',
      '‍Traditional Vietnamese Lunch: A culinary journey to complement your adventure.',
      'All Entrance Fees: Seamless access to all planned attractions.',
      'Convenient Pick-up & Drop-off: From downtown hotels for your comfort.',
      'Travel Insurance: Essential journey safeguard.',
    ],
    notes: [
      'Gratuity: $5 USD/person/day (guide, driver, and staff).',
      'Kindly note that ammunition at the Cu Chi shooting range and surcharges for special dietary requests (e.g. Halal, vegetarian, etc.) are not included in the tour price.',
      'Flexible cancellation up to 10 days prior to travel.',
    ],
  },
  'sunset-cruise': {
    id: 'sunset-cruise',
    name: 'Saigon Sunset Cruise',
    subtitle: 'Witness the Golden Hour on Saigon River',
    type: 'Cruise',
    bookingType: 'day-tour',
    duration: '2 hours',
    image: '/images/tours/sunset-cruise.jpg',
    adultPrice: 950000,
    childPrice: 650000,
    infantPrice: 0,
    includes: [
      'Sunset cruise on Saigon River',
      'Welcome drink',
      'Light snacks',
      'Live music entertainment',
      'Photo opportunities',
    ],
    notes: [
      'Tour departs at 5:30 PM daily',
      'Duration approximately 2 hours',
      'Smart casual dress code',
      'Not recommended for children under 4',
    ],
  },
  'mekong-delta': {
    id: 'mekong-delta',
    name: 'Mekong Delta Adventure',
    subtitle: 'Explore the Rice Bowl of Vietnam',
    type: 'Day-tour',
    bookingType: 'overnight-tour',
    duration: '2 days / 1 night',
    image: '/images/tours/mekong-delta.jpg',
    adultPrice: 2500000,
    childPrice: 1800000,
    infantPrice: 0,
    includes: [
      'Luxury speedboat transfer',
      'Visit to floating markets',
      'Traditional Vietnamese lunch',
      'Coconut candy workshop visit',
      'Sampan boat ride through canals',
      'English-speaking guide',
    ],
    notes: [
      'Early departure at 6:30 AM',
      'Full day excursion',
      'Moderate physical activity required',
      'Bring sunscreen and hat',
    ],
  },
};

export function getTourById(tourId: string): Tour | undefined {
  return TOURS[tourId];
}

export function getAllTours(): Tour[] {
  return Object.values(TOURS);
}

export function calculateTotalPrice(
  tourId: string,
  adults: number,
  children: number,
  infants: number = 0
): number {
  const tour = getTourById(tourId);
  if (!tour) return 0;
  return adults * tour.adultPrice + children * tour.childPrice + infants * tour.infantPrice;
}
