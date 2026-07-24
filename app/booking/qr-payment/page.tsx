import Navbar from '@/components/layout/Navbar';
import Image from 'next/image';
import Link from 'next/link';

export default async function QRPaymentPage() {
  return (
    <div className="success-page qr-payment-page">
      <Navbar />
      <div className="success-page__container">
        <div className="success-page__card">
          <div className="qr-payment-page__content">
            <div className="qr-payment-page__icon" aria-hidden="true">
              <Image
                src="/confirming.png"
                alt=""
                width={120}
                height={118}
                priority
              />
            </div>

            <h1 className="qr-payment-page__title">Confirming Your Booking</h1>

            <p className="qr-payment-page__message">
              We&apos;re securely confirming your transaction with the payment provider before finalizing your booking.
            </p>

            <p className="qr-payment-page__message qr-payment-page__message--secondary">
              You&apos;ll receive your booking confirmation via email once the verification is complete.
            </p>

            <Link href="/" className="qr-payment-page__home-button">
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
