'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense, useState, useCallback, useEffect, useRef } from 'react';
import Navbar from '@/components/layout/Navbar';
import TourCard from '@/components/features/TourCard';
import BookingForm from '@/components/features/BookingForm';
import TripTotal from '@/components/features/TripTotal';
import { type Tour } from '@/lib/tours-data';
import { parseBookingParams } from '@/lib/url-params';

function BookingContent() {
  const searchParams = useSearchParams();
  
  // Parse all URL params from Webflow
  const urlParams = parseBookingParams(searchParams);
  const tourId = urlParams.tourId;

  const [tour, setTour] = useState<Tour | null>(null);
  const [isLoadingTour, setIsLoadingTour] = useState(true);

  useEffect(() => {
    async function fetchTour() {
      if (!tourId) {
        setTour(null);
        setIsLoadingTour(false);
        return;
      }

      try {
        const res = await fetch('/api/tours');
        if (!res.ok) throw new Error('Failed to fetch tours');
        const tours: Tour[] = await res.json();
        // Exact match only - no fallback to default tour
        const found = tours.find(t => t.id === tourId);
        setTour(found || null);
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoadingTour(false);
      }
    }
    fetchTour();
  }, [tourId]);

  const [currentStep, setCurrentStep] = useState(1);
  // const [selectedDate, setSelectedDate] = useState('');
  const [totalPrice, setTotalPrice] = useState(0);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const formContainerRef = useRef<HTMLDivElement>(null);
  const [tripTotalStyle, setTripTotalStyle] = useState<React.CSSProperties>({});

  // Calculate TripTotal position based on form container
  useEffect(() => {
    const updatePosition = () => {
      if (formContainerRef.current) {
        const rect = formContainerRef.current.getBoundingClientRect();
        setTripTotalStyle({
          position: 'fixed',
          bottom: '30px',
          left: `${rect.left}px`,
          width: `${rect.width}px`,
        });
      }
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition);
    };
  }, []);

  console.log(isSubmitting)

  const handleFormSubmit = useCallback(async (data: {
    date: string;
    returnDate?: string;
    time?: string;
    adults: number;
    children: number;
    infants: number;
    guests: Array<{
      firstName: string;
      lastName: string;
      gender: string;
      dateOfBirth: string;
      citizenship: string;
      residence: string;
      phone: string;
      email: string;
      idNumber: string;
      issueDate: string;
      expiryDate: string;
      issuingAuthority: string;
      note?: string;
    }>;
  }) => {
    if (!tour) return;

    setIsSubmitting(true);

    try {
      console.log('Sending checkout payload:', {
        tourId: tour.id,
        ...data,
        customerInfo: data.guests[0]
      });

      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tourId: tour.id,
          ...data,
          customerInfo: data.guests[0] // Send primary guest info for order reference
        }),
      });

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        console.error('Non-JSON response:', text);
        setIsSubmitting(false);
        throw new Error('Server returned a non-JSON response. Check console for details.');
      }

      const result = await response.json();

      if (!response.ok) {
        setIsSubmitting(false);
        throw new Error(result.error || 'Checkout failed');
      }

      console.log('Payment URL received:', result.paymentUrl);

      if (result.paymentUrl) {
        window.location.href = result.paymentUrl;
      } else {
        setIsSubmitting(false);
        throw new Error('No payment URL received from server');
      }
    } catch (error) {
      console.error('Payment Error:', error);
      setIsSubmitting(false);
      alert(error instanceof Error ? error.message : 'Failed to initiate payment. Please try again.');
    }
  }, [tour]);

  const handleContinue = useCallback(() => {
    if (currentStep < 4) {
      // Use setImmediate to ensure state update is processed in the next tick
      // This is a workaround for potential React batching issues or race conditions
      setTimeout(() => {
        setCurrentStep(prev => prev + 1);
      }, 0);
    }
  }, [currentStep, setCurrentStep]);

  if (isLoadingTour) {
    return <BookingPageSkeleton />;
  }

  if (!tour) {
    return (
      <div className="booking-page">
        <Navbar />
        <div className="booking-page__body">
          <div className="error-container">
            <div className="error-card">
              <div className="error-card__icon">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 8V12M12 16H12.01M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z" stroke="#56231E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h1 className="error-card__title">Tour Not Found</h1>
              <p className="error-card__message">
                The tour you are looking for does not exist or has been removed. 
                Please check the link or contact us for assistance.
              </p>
              <a href="https://www.saigonriverstar.com" className="btn-primary">
                Back to Homepage
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="booking-page">
      <Navbar />

      <div className="booking-page__body">
        <div className="booking-page__background">
          <aside className="booking-page__sidebar">
            <TourCard tour={tour} />
          </aside>

          <main className="booking-page__main" ref={formContainerRef}>
            <BookingForm
              tourId={tour.id}
              tourType={tour.bookingType}
              adultPrice={tour.adultPrice}
              childPrice={tour.childPrice}
              infantPrice={tour.infantPrice}
              currentStep={currentStep}
              onSubmit={handleFormSubmit}
              onStepChange={setCurrentStep}
              onPriceChange={setTotalPrice}
            />
          </main>
        </div>
      </div>

      {/* TripTotal positioned using JS calculation */}
      {(currentStep === 2 || currentStep === 3) && (
        <div style={tripTotalStyle}>
          <TripTotal
            totalPrice={totalPrice}
            onContinue={handleContinue}
            showContinue={true}
            isLoading={isSubmitting}
            isLastStep={currentStep === 3}
          />
        </div>
      )}
    </div>
  );
}

export default function BookingPage() {
  return (
    <Suspense fallback={<BookingPageSkeleton />}>
      <BookingContent />
    </Suspense>
  );
}

function BookingPageSkeleton() {
  return (
    <div className="booking-page">
      <Navbar />
      <div className="booking-page__body">
        <div className="booking-page__background">
          <div className="booking-page__sidebar">
            <div style={{
              width: 506,
              height: 670,
              backgroundColor: '#fff',
              borderRadius: 25,
              animation: 'pulse 2s infinite'
            }} />
          </div>
          <div className="booking-page__main">
            <div style={{
              width: '100%',
              height: 400,
              backgroundColor: 'rgba(255,255,255,0.5)',
              borderRadius: 20,
              animation: 'pulse 2s infinite'
            }} />
          </div>
        </div>
      </div>
    </div>
  );
}
