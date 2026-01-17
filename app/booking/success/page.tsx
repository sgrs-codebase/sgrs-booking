'use client';

import { useSearchParams } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import Link from 'next/link';
import { Suspense } from 'react';

function SuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');

  return (
    <div className="container mx-auto px-4 py-12 text-center">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-2xl mx-auto">
        <div className="mb-6 text-green-600">
          <svg className="w-20 h-20 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
          </svg>
        </div>
        <h1 className="text-3xl font-bold mb-4 font-serif text-red-brown">Booking Successful!</h1>
        <p className="text-gray-600 mb-6">
          Thank you for booking with Saigon River Star. Your payment has been processed successfully.
        </p>
        {orderId && (
          <div className="bg-gray-100 p-4 rounded mb-6">
            <p className="text-sm text-gray-500">Order Reference</p>
            <p className="text-lg font-mono font-bold">{orderId}</p>
          </div>
        )}
        <p className="text-sm text-gray-500 mb-8">
          We have sent a confirmation email to your inbox. Please check your spam folder if you don&apos;t see it.
        </p>
        <Link href="/" className="btn-primary inline-block">
          Return to Home
        </Link>
      </div>
    </div>
  );
}

export default function BookingSuccessPage() {
  return (
    <div className="min-h-screen bg-beige">
      <Navbar />
      <div className="pt-24">
        <Suspense fallback={<div>Loading...</div>}>
          <SuccessContent />
        </Suspense>
      </div>
    </div>
  );
}
