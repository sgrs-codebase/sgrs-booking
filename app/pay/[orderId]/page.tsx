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


  if (isLoading) {
    return (
      <div className="pay-page">
        <Navbar />
        <div className="pay-page__status">
          <span className="spinner"></span>
          <span className="ml-3">Loading order details...</span>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="pay-page">
        <Navbar />
        <div className="pay-page__status pay-page__status--error">
          <p>Error: {error || 'Order not found'}</p>
          <button onClick={() => window.location.reload()} className="btn-primary">Try Again</button>
        </div>
      </div>
    );
  }

  return (
    <div className="pay-page">
      <Navbar />
      <div className="pay-page__container">
        <div className="pay-page__card">
          <div className="pay-page__header">
            <h1 className="pay-page__title">Complete Your Payment</h1>
            <p className="pay-page__message">Please review your order details before proceeding to payment.</p>
          </div>
          
          <div className="pay-page__details">
            <div className="pay-page__detail-row">
              <span className="label">Order ID</span>
              <span className="value">{order.OrderID}</span>
            </div>
            <div className="pay-page__detail-row">
              <span className="label">Customer</span>
              <span className="value">{order.CustomerName}</span>
            </div>
            <div className="pay-page__detail-row">
              <span className="label">Tour</span>
              <span className="value">{order.TourID}</span>
            </div>
            <div className="pay-page__detail-row">
              <span className="label">Travel Date</span>
              <span className="value">{order.TravelDate}</span>
            </div>
            <div className="pay-page__detail-row pay-page__detail-row--total">
              <span className="label">Total Amount</span>
              <span className="value">{formatPrice(order.Amount)} VND</span>
            </div>
          </div>

          <div className="pay-page__actions">
            <button
              onClick={handlePay}
              disabled={isProcessing}
              className="pay-page__pay-button"
            >
              {isProcessing ? (
                <>
                  <span className="spinner spinner--white spinner--small"></span>
                  <span>Redirecting to OnePay...</span>
                </>
              ) : (
                'Pay Now'
              )}
            </button>
            
            <p className="pay-page__footer-note">
              Secure payment powered by OnePay
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
