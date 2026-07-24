'use client';

interface TripTotalProps {
  totalPrice: number;
  onContinue: () => void;
  showContinue?: boolean;
  isLoading?: boolean;
  isLastStep?: boolean;
}

export default function TripTotal({ 
  totalPrice, 
  onContinue, 
  showContinue = true,
  isLoading = false,
  isLastStep = false
}: TripTotalProps) {
  const formatPrice = (price: number) => {
    return price.toLocaleString('vi-VN').replace(/,/g, '.');
  };

  return (
    <div className="trip-total">
      <div className="trip-total__content">
        <div className="trip-total__header">
          <span className="trip-total__label">Trip total</span>
          <span className="trip-total__price">{formatPrice(totalPrice)} VND</span>
        </div>
        <p className="trip-total__note">All prices include taxes and fees</p>
      </div>
      
      {showContinue && (
        <div className="trip-total__action">
          {isLastStep ? (
            <button 
              type="submit" 
              form="booking-form" 
              className="btn-primary flex justify-center items-center gap-2" 
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="spinner spinner--small spinner--white" style={{ marginRight: '10px' }} />
                  <span>Processing...</span>
                </>
              ) : (
                'Proceed to Payment'
              )}
            </button>
          ) : (
            <button type="button" className="btn-primary" onClick={onContinue}>
              Continue
            </button>
          )}
        </div>
      )}
    </div>
  );
}
