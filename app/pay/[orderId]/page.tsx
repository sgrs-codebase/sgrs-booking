'use client';

import { use } from 'react';
import { useState, useEffect, useCallback } from 'react';
import Navbar from '@/components/layout/Navbar';
import { OrderRecord } from '@/lib/airtable';

const formatPrice = (price: string | number) => {
  return Number(price).toLocaleString('vi-VN').replace(/,/g, '.');
};

export default function RepayPage({ params: paramsPromise }: { params: Promise<{ orderId: string }> }) {
  const params = use(paramsPromise);
  const [order, setOrder] = useState<OrderRecord | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    async function fetchOrder() {
      try {
        const res = await fetch(`/api/orders/${params.orderId}`);
        if (!res.ok) throw new Error('Order not found');
        const data = await res.json();
        setOrder(data);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    }
    fetchOrder();
  }, [params.orderId]);

  const handlePay = async () => {
    setIsProcessing(true);
    try {
      const res = await fetch('/api/checkout/repay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: params.orderId }),
      });
      const data = await res.json();
      if (data.paymentUrl) {
        window.location.href = data.paymentUrl;
      } else {
        throw new Error(data.error || 'Failed to generate payment link');
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Unknown error');
      setIsProcessing(false);
    }
  };


  if (isLoading) return <div className="p-20 text-center">Loading order details...</div>;
  if (error || !order) return <div className="p-20 text-center text-red-600">Error: {error || 'Order not found'}</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-2xl mx-auto py-12 px-4">
        <div className="bg-white rounded-2xl shadow-sm p-8 border border-gray-100">
          <h1 className="text-2xl font-bold text-[#56231E] mb-6">Complete Your Payment</h1>
          
          <div className="space-y-4 mb-8">
            <div className="flex justify-between pb-4 border-bottom border-gray-100">
              <span className="text-gray-500">Order ID</span>
              <span className="font-semibold">{order.OrderID}</span>
            </div>
            <div className="flex justify-between pb-4 border-bottom border-gray-100">
              <span className="text-gray-500">Customer</span>
              <span className="font-semibold">{order.CustomerName}</span>
            </div>
            <div className="flex justify-between pb-4 border-bottom border-gray-100">
              <span className="text-gray-500">Tour</span>
              <span className="font-semibold">{order.TourID}</span>
            </div>
            <div className="flex justify-between pb-4 border-bottom border-gray-100">
              <span className="text-gray-500">Travel Date</span>
              <span className="font-semibold">{order.TravelDate}</span>
            </div>
            <div className="flex justify-between pt-4 border-t border-gray-200">
              <span className="text-lg font-bold">Total Amount</span>
              <span className="text-lg font-bold text-[#56231E]">{formatPrice(order.Amount)} VND</span>
            </div>
          </div>

          <button
            onClick={handlePay}
            disabled={isProcessing}
            className="w-full py-4 bg-[#56231E] text-white rounded-xl font-bold text-lg hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {isProcessing ? 'Redirecting to OnePay...' : 'Pay Now'}
          </button>
          
          <p className="mt-4 text-center text-sm text-gray-400">
            Secure payment powered by OnePay
          </p>
        </div>
      </div>
    </div>
  );
}
