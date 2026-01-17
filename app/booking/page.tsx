'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense, useState, useCallback } from 'react';
import Navbar from '@/components/layout/Navbar';
import TourCard from '@/components/features/TourCard';
import BookingForm from '@/components/features/BookingForm';
import TripTotal from '@/components/features/TripTotal';
import { getTourById } from '@/lib/tours-data';

// Default tour for demo purposes
const DEFAULT_TOUR_ID = 'cu-chi-tunnels';

function BookingContent() {
  const searchParams = useSearchParams();
  const tourId = searchParams.get('tourId') || DEFAULT_TOUR_ID;
  
  // Get tour data - validate against our source of truth
  const tour = getTourById(tourId) || getTourById(DEFAULT_TOUR_ID)!;
  
  const [currentStep, setCurrentStep] = useState(1);
  // const [selectedDate, setSelectedDate] = useState('');
  const [totalPrice, setTotalPrice] = useState(0);

  const [isSubmitting, setIsSubmitting] = useState(false);

  console.log(isSubmitting)

  const handleFormSubmit = useCallback(async (data: {
    date: string;
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
    }>;
  }) => {
    try {
      setIsSubmitting(true);
      
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
         throw new Error('Server returned a non-JSON response. Check console for details.');
      }

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Checkout failed');
      }
      
      if (result.paymentUrl) {
        window.location.href = result.paymentUrl;
      }
    } catch (error) {
      console.error('Payment Error:', error);
      alert(error instanceof Error ? error.message : 'Failed to initiate payment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [tour.id]);

  const handleContinue = useCallback(() => {
    if (currentStep < 4) {
      // Use setImmediate to ensure state update is processed in the next tick
      // This is a workaround for potential React batching issues or race conditions
      setTimeout(() => {
        setCurrentStep(prev => prev + 1);
      }, 0);
    }
  }, [currentStep, setCurrentStep]);

  return (
    <div className="booking-page">
      <Navbar />
      
      <div className="booking-page__body">
        <div className="booking-page__background">
          <aside className="booking-page__sidebar">
            <TourCard tour={tour} />
          </aside>
          
          <main className="booking-page__main">
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
      
      {/* TripTotal should be visible on Step 2 (Guest Amount) and Step 3 (Guest Info) */}
      {(currentStep === 2 || currentStep === 3) && (
        <TripTotal
                totalPrice={totalPrice}
                onContinue={handleContinue}
                showContinue={true}
                isLoading={isSubmitting}
                isLastStep={currentStep === 3}
              />
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
