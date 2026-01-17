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
    <div className="booking-steps-container">
      <div className="step-indicator">
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
              className={`step-indicator__item step-indicator__item--${status} ${isClickable ? 'step-indicator__item--clickable' : ''}`}
              onClick={() => isClickable && onStepClick?.(step.id)}
            >
              <span className="step-indicator__label">{step.label}</span>
              {stepValue && (
                <span className="step-indicator__sublabel">{stepValue}</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
