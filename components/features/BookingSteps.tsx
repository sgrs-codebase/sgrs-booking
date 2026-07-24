'use client';

interface Step {
  id: number;
  label: string;
  subLabel?: string;
}

interface BookingStepsProps {
  steps: Step[];
  currentStep: number;
  selectedDate?: string;
  guestCount?: number;
  onStepClick?: (stepId: number) => void;
}

export default function BookingSteps({ 
  steps, 
  currentStep, 
  selectedDate, 
  guestCount,
  onStepClick
}: BookingStepsProps) {
  const getStepStatus = (stepId: number) => {
    if (stepId < currentStep) return 'completed';
    if (stepId === currentStep) return 'active';
    return 'inactive';
  };

  return (
    <div className="booking-steps">
      {steps.map((step) => {
        const status = getStepStatus(step.id);
        const isClickable = step.id < currentStep;
        
        // Determine dynamic value for the step
        let stepValue = step.subLabel;
        if (step.id === 1 && selectedDate) {
          stepValue = selectedDate;
        } else if (step.id === 2 && guestCount) {
          stepValue = `${guestCount} Guest${guestCount > 1 ? 's' : ''}`;
        }

        return (
          <div 
            key={step.id}
            className={`booking-steps__step ${status === 'inactive' ? 'booking-steps__step--inactive' : ''} ${isClickable ? 'booking-steps__step--clickable' : ''}`}
            onClick={() => isClickable && onStepClick?.(step.id)}
          >
            <div className="booking-steps__line" />
            <span className="booking-steps__label">
              {step.label}
              {stepValue && <span className="booking-steps__sublabel"> ({stepValue})</span>}
            </span>
          </div>
        );
      })}
    </div>
  );
}
