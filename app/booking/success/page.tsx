import Navbar from '@/components/layout/Navbar';
import { getOrderFromAirtable, getToursFromAirtable, TourRecord } from '@/lib/airtable';

export const dynamic = 'force-dynamic';

const formatPrice = (price: string | number) => {
  return Number(price).toLocaleString('vi-VN').replace(/,/g, '.');
};

const parseGuests = (details: string) => {
  try {
    return JSON.parse(details);
  } catch {
    return [];
  }
};

const parseGuestCounts = (guestsStr: string): { adults: number; children: number; infants: number } => {
  const match = guestsStr.match(/(\d+)\s*Adults?,\s*(\d+)\s*Children,\s*(\d+)\s*Infants?/);
  if (match) {
    return {
      adults: parseInt(match[1], 10),
      children: parseInt(match[2], 10),
      infants: parseInt(match[3], 10),
    };
  }
  return { adults: 0, children: 0, infants: 0 };
};

const getGuestType = (index: number, counts: { adults: number; children: number; infants: number }): string => {
  if (index < counts.adults) return 'Adult';
  if (index < counts.adults + counts.children) return 'Child';
  return 'Infant';
};

const formatGuestName = (firstName: string, lastName: string, gender: string): string => {
  const title = gender.toLowerCase() === 'male' ? 'MR' : 'MS';
  return `${lastName.toUpperCase()}/${firstName.toUpperCase()} ${title}`;
};

const getGuestPrice = (type: string, tour: TourRecord): number => {
  if (type === 'Adult') return tour.adultPrice;
  if (type === 'Child') return tour.childPrice;
  return tour.infantPrice;
};

export default async function BookingSuccessPage({
  searchParams
}: {
  searchParams: Promise<{ orderId: string }>
}) {
  const { orderId } = await searchParams;

  const order = orderId ? await getOrderFromAirtable(orderId) : null;

  // Guard: only show success page for orders that are actually paid
  const isPaid = order?.PaymentStatus === 'Paid' || order?.PaymentStatus === 'Paid (Fallback)';

  let tour = null;
  if (order && isPaid) {
    const tours = await getToursFromAirtable();
    tour = tours.find(t => t.id === order.TourID);
  }

  const guests = order && isPaid ? parseGuests(order.FullGuestDetails) : [];
  const guestCounts = order && isPaid ? parseGuestCounts(order.Guests) : { adults: 0, children: 0, infants: 0 };

  return (
    <div className="success-page">
      <Navbar />
      <div className="success-page__container">
        <div className="success-page__card">
          <div className="success-page__header">
            <svg width="50" height="50" viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg">
              <mask id="path-1-inside-1_1721_3217" fill="white">
                <path d="M0 10C0 4.47715 4.47715 0 10 0H40C45.5228 0 50 4.47715 50 10V40C50 45.5228 45.5228 50 40 50H10C4.47715 50 0 45.5228 0 40V10Z" />
              </mask>
              <path d="M10 -0.550033C10 -0.183344 10 0.183344 10 0.550033C13.0472 0.611147 16.0945 0.669206 19.1417 0.72421C26.0945 0.849708 33.0472 0.959299 40 1.05298C44.7686 1.01306 48.9333 5.33993 48.7624 10C48.6621 20 48.5948 30 48.5603 40C48.6525 44.5579 44.542 48.6446 40 48.5332C30 48.5332 20 48.5662 10 48.632C5.40809 48.7818 1.18029 44.6686 1.23757 40C1.13729 30 1.00411 20 0.838012 10C0.795514 7.98958 1.43733 5.96884 2.65249 4.33754C4.32807 2.05177 7.10881 0.591492 10 0.550033C10 0.183344 10 -0.183344 10 -0.550033C6.77851 -0.635609 3.53511 0.883728 1.50592 3.4525C0.0346727 5.28272 -0.809641 7.62756 -0.838012 10C-1.00411 20 -1.13729 30 -1.23757 40C-1.43932 45.9846 3.93869 51.4773 10 51.368C20 51.4338 30 51.4668 40 51.4668C46.1112 51.6144 51.6065 46.0953 51.4397 40C51.4052 30 51.3379 20 51.2376 10C51.3258 4.00685 45.8846 -1.27209 40 -1.05298C33.0472 -0.959299 26.0945 -0.849708 19.1417 -0.72421C16.0945 -0.669206 13.0472 -0.611147 10 -0.550033ZM10 0.550033V-0.550033V0.550033Z" fill="#56231E" mask="url(#path-1-inside-1_1721_3217)" />
              <path d="M10.6233 27.1208C10.364 27.3801 10.1047 27.6394 9.84544 27.8987C10.4011 28.5408 10.9589 29.1807 11.5188 29.8184C14.5349 33.2535 17.6137 36.6259 20.7551 39.9356L21.9401 41.1828L22.8742 39.6566C24.4736 37.0461 26.0383 34.4156 27.5686 31.7652C31.3796 25.1642 34.9763 18.4395 38.3586 11.5911C38.7345 10.8302 39.1076 10.0677 39.4782 9.3037C39.1606 9.12036 38.843 8.93701 38.5255 8.75367C38.0491 9.45655 37.5754 10.161 37.1043 10.8669C32.8645 17.2203 28.8391 23.6975 25.0281 30.2984C23.4978 32.9488 22.0022 35.6192 20.5411 38.3095L22.6601 38.0306C19.3505 34.8891 15.9781 31.8103 12.543 28.7942C11.9053 28.2343 11.2654 27.6765 10.6233 27.1208Z" fill="#56231E" />
            </svg>
            <h1 className="success-page__title">Payment Successful</h1>
            <p className="success-page__message">
              Your booking has been successfully confirmed. Here are the details of your trip.
            </p>
          </div>

          <div className="success-page__divider" />

          {order && isPaid && tour ? (
            <>
              <div className="success-page__tour-info">
                <h2>{tour.name}</h2>
                <p>{tour.subtitle}</p>
              </div>

              <div className="success-page__divider" />

              <div className="success-page__details-list">
                <div className="success-page__detail-row">
                  <span className="label"><strong>Booking ID:</strong></span>
                  <span className="value">{order.OrderID}</span>
                </div>
                <div className="success-page__detail-row">
                  <span className="label"><strong>Departure:</strong></span>
                  <span className="value">
                    {order.TravelDate} {order.ReturnDate ? `- ${order.ReturnDate}` : ''}, {order.DepartureTime || '07:00'}
                  </span>
                </div>
                <div className="success-page__detail-row">
                  <span className="label"><strong>Check-in:</strong></span>
                  <span className="value">
                    Bach Dang Wharf, 2 Ton Duc Thang Street, Ben Nghe Ward, District 1, Ho Chi Minh City
                  </span>
                </div>
              </div>

              <div className="success-page__guest-list">
                <div className="success-page__guest-header">
                  <span>Name</span>
                  <span>Fee</span>
                  <span>Note</span>
                </div>
                {guests.map((guest: { firstName: string; lastName: string; gender: string; note?: string }, index: number) => {
                  const guestType = getGuestType(index, guestCounts);
                  const guestPrice = tour ? getGuestPrice(guestType, tour) : 0;
                  return (
                    <div className="success-page__guest-row" key={index}>
                      <div>
                        <span className="guest-name">
                          {formatGuestName(guest.firstName, guest.lastName, guest.gender)}
                        </span>
                        <span className="guest-type">{guestType}</span>
                      </div>
                      <span className="guest-fee">
                        {tour ? formatPrice(guestPrice) : '-'} VND
                      </span>
                      <span className="guest-note">{guest.note || '-'}</span>
                    </div>
                  );
                })}
              </div>

              <div className="success-page__total">
                <span className="label">Total</span>
                <span className="amount">{formatPrice(order.Amount)} VND</span>
              </div>

              <div className="success-page__notices">
                <h3>Notices</h3>
                <div className="content" dangerouslySetInnerHTML={{
                  __html: tour.notices || `<ul>
                    <li>
                      <strong>All guests must carry valid passports or citizen identification cards throughout the journey.</strong>
                    </li>
                    <li>
                      Guests who fail to arrive without prior written cancellation will be considered no-shows. 100% of the service value will be charged, and no refunds will be issued.
                    </li>
                    <li>
                      For more details, please read Sai Gon River Stars' <u>Delivery & Transportation Policy</u>, <u>Payment & Cancellation Policy</u>, <u>Service Terms & Conditions</u>.
                    </li>
                    <li>
                      Passengers are responsible for ensuring arrive at the designated check-in location on time. Late arrivals or missed departures are treated as no-shows and are subject to applicable charges.
                    </li>
                    <li>
                      Sai Gon River Star reserves the right to refuse service in the following cases:
                      <ul>
                        <li>Foreign guest does not possess a valid passport or holds an expired passport.</li>
                        <li>Vietnamese guest does not possess a valid passport or citizen identification card.</li>
                        <li>Required guest information is incomplete, inaccurate, or submitted late.</li>
                      </ul>
                    </li>
                    <li>
                      Insurance coverage: Sai Gon River Star has arranged and put in force Public and Product Liability Insurance through certified insurers that cover all cruise-related activities following international standards of quality in terms of scope of cover and limit of indemnity. A summary of insurance cover is available on request.
                    </li>
                    <li>
                      Contact Sai Gon River Star' Contact Center:
                      <ul>
                        <li>Hotline: (+84) 98 391 23 25</li>
                        <li>Email: info@saigonriverstar.com</li>
                      </ul>
                    </li>
                  </ul>`
                }} />
              </div>

              <div className="success-page__force-majeure">
                <h3>Force Majeure & Weather Conditions</h3>
                <div className="content" dangerouslySetInnerHTML={{
                  __html: tour.forceMajeure || `<p class="no-bullet">In the event of unforeseen circumstances beyond our reasonable control (such as natural disasters, severe weather, government restrictions, strikes, or other similar events), Sai Gon River Star may be unable to operate part or all of the tour as planned.</p>
                  <ul>
                    <li>In such cases, the affected obligations may be suspended, and we will inform you as soon as possible.</li>
                    <li>If the situation lasts for an extended period, both parties will discuss and seek a reasonable solution.</li>
                    <li>Sai Gon River Star is not responsible for any failure to provide services caused by these events, but we will always make reasonable efforts to support our guests.</li>
                    <li>For bad weather conditions, we reserve the right to cancel or adjust part or all of the cruise schedule to ensure safety. Any applicable surcharges (if any) will follow our company policy.</li>
                  </ul>
                  <p class="no-bullet">Your safety and experience are always our top priorities.</p>`
                }} />
              </div>

              <div className="success-page__footer-note">
                <div className="content">
                  <p className="no-bullet">If you have any questions or need further assistance, please feel free to contact us anytime. We look forward to welcoming you on board and wishing you a wonderful journey with Sai Gon River Star!</p>
                  <br />
                  <p className="no-bullet">Warm regards,</p>
                  <br />
                  <p className="no-bullet"><strong>Sai Gon River Star Team</strong></p>
                  <p className="no-bullet">Email: <u>info@saigonriverstar.com</u></p>
                  <p className="no-bullet">Hotline: +84 97 816 09 59</p>
                  <p className="no-bullet">Website: saigonriverstar.com</p>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <p>Order details not found. Please check your email for confirmation.</p>
              {orderId && <p className="text-sm text-gray-500 mt-2">Ref: {orderId}</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}