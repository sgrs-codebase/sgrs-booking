'use client';

import { useSearchParams } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import Link from 'next/link';
import { Suspense } from 'react';

function FailedContent() {
  const searchParams = useSearchParams();
  const reason = searchParams.get('reason');
  const code = searchParams.get('code');

  const getErrorMessage = () => {
    switch (reason) {
      case 'invalid_signature':
        return 'Security verification failed. Please try again.';
      case 'payment_failed':
        return `Payment failed or was cancelled by user. (Code: ${code})`;
      default:
        return 'An unknown error occurred during payment processing.';
    }
  };

  return (
    <div className="container mx-auto px-4 py-12 text-center">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-2xl mx-auto">
        <div className="mb-6 text-red-600">
          <svg className="w-20 h-20 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
        </div>
        <h1 className="text-3xl font-bold mb-4 font-serif text-red-brown">Booking Failed</h1>
        <p className="text-gray-600 mb-6">
          {getErrorMessage()}
        </p>
        <div className="flex justify-center gap-4">
          <Link href="/booking" className="btn-primary">
            Try Again
          </Link>
          <Link href="/" className="px-6 py-3 border border-gray-300 rounded text-gray-700 hover:bg-gray-50 transition-colors">
            Return Home
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function BookingFailedPage() {
  return (
    <div className="min-h-screen bg-beige">
      <Navbar />
      <div className="pt-24">
        <Suspense fallback={<div>Loading...</div>}>
          <FailedContent />
        </Suspense>
      </div>
    </div>
  );
}
