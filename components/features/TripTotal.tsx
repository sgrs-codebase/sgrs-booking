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
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
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
