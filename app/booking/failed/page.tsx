import Navbar from '@/components/layout/Navbar';
import Link from 'next/link';

export default function BookingFailedPage() {
  return (
    <div className="failed-page">
      <Navbar />
      <div className="failed-page__container">
        <div className="failed-page__card">
          <div className="failed-page__header">
            <svg width="50" height="50" viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg">
              <mask id="path-1-inside-1" fill="white">
                <path d="M0 10C0 4.47715 4.47715 0 10 0H40C45.5228 0 50 4.47715 50 10V40C50 45.5228 45.5228 50 40 50H10C4.47715 50 0 45.5228 0 40V10Z" />
              </mask>
              <path d="M10 -0.550033C10 -0.183344 10 0.183344 10 0.550033C13.0472 0.611147 16.0945 0.669206 19.1417 0.72421C26.0945 0.849708 33.0472 0.959299 40 1.05298C44.7686 1.01306 48.9333 5.33993 48.7624 10C48.6621 20 48.5948 30 48.5603 40C48.6525 44.5579 44.542 48.6446 40 48.5332C30 48.5332 20 48.5662 10 48.632C5.40809 48.7818 1.18029 44.6686 1.23757 40C1.13729 30 1.00411 20 0.838012 10C0.795514 7.98958 1.43733 5.96884 2.65249 4.33754C4.32807 2.05177 7.10881 0.591492 10 0.550033C10 0.183344 10 -0.183344 10 -0.550033C6.77851 -0.635609 3.53511 0.883728 1.50592 3.4525C0.0346727 5.28272 -0.809641 7.62756 -0.838012 10C-1.00411 20 -1.13729 30 -1.23757 40C-1.43932 45.9846 3.93869 51.4773 10 51.368C20 51.4338 30 51.4668 40 51.4668C46.1112 51.6144 51.6065 46.0953 51.4397 40C51.4052 30 51.3379 20 51.2376 10C51.3258 4.00685 45.8846 -1.27209 40 -1.05298C33.0472 -0.959299 26.0945 -0.849708 19.1417 -0.72421C16.0945 -0.669206 13.0472 -0.611147 10 -0.550033ZM10 0.550033V-0.550033V0.550033Z" fill="#56231E" mask="url(#path-1-inside-1)" />
              <path d="M17.5 17.5L32.5 32.5M32.5 17.5L17.5 32.5" stroke="#56231E" strokeWidth="2" strokeLinecap="round" />
            </svg>

            <h1 className="failed-page__title">Payment Unsuccessful</h1>

            <div className="failed-page__message">
              <p>
                Unfortunately, your payment could not be completed,
                so your booking has not been confirmed yet.
              </p>
              <p>
                This may happen due to a temporary bank issue,
                network interruption, or card authorization error.
              </p>
            </div>
          </div>

          <div className="failed-page__actions">
            <Link href="/booking" className="failed-page__btn">
              Try Again
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
