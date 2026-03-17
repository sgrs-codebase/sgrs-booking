'use client';

import { useState, useEffect } from 'react';
import BookingSteps from './BookingSteps';
import { PhoneInput } from 'react-international-phone';
import 'react-international-phone/style.css';
import { isPossiblePhoneNumber, parsePhoneNumber } from 'libphonenumber-js';

// Calendar Icon SVG
const CalendarIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M19 4H5C3.89543 4 3 4.89543 3 6V20C3 21.1046 3.89543 22 5 22H19C20.1046 22 21 21.1046 21 20V6C21 4.89543 20.1046 4 19 4Z" stroke="#56231E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M16 2V6" stroke="#56231E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M8 2V6" stroke="#56231E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M3 10H21" stroke="#56231E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// Chevron Icons
const ChevronLeft = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path d="M15 18L9 12L15 6" stroke="#49454F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ChevronRight = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path d="M9 18L15 12L9 6" stroke="#49454F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ChevronDown = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <path d="M4.5 6.75L9 11.25L13.5 6.75" stroke="#49454F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const CloseIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path d="M18 6L6 18M6 6L18 18" stroke="#49454F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const validateName = (name: string): boolean => {
  const trimmedName = name.trim();
  
  // Must contain at least one letter
  const hasLetter = /[a-zA-ZÀ-ỹ]/.test(trimmedName);
  
  // Only allows letters, spaces, hyphens, and apostrophes
  const validChars = /^[a-zA-ZÀ-ỹ\s'-]+$/.test(trimmedName);
  
  // Must be at least 2 characters and contain at least one letter
  return trimmedName.length >= 2 && hasLetter && validChars;
};

const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
};

const validatePhone = (phone: string): { isValid: boolean; message?: string } => {
  // Remove spaces and other formatting for validation
  const cleanPhone = phone.replace(/[\s()-]/g, '').trim();
  
  // Check if phone is empty
  if (!cleanPhone) {
    return { isValid: false, message: 'Please enter a phone number' };
  }
  
  // Check if phone starts with +
  if (!cleanPhone.startsWith('+')) {
    return { isValid: false, message: 'Phone number must include country code' };
  }
  
  try {
    // Use isPossiblePhoneNumber for less strict validation (checks format & length, not if number truly exists)
    const isPossible = isPossiblePhoneNumber(cleanPhone);
    
    if (!isPossible) {
      // Try to get more specific error by parsing
      try {
        const phoneNumber = parsePhoneNumber(cleanPhone);
        if (phoneNumber.country) {
          return { isValid: false, message: `Invalid phone number length for ${phoneNumber.country}` };
        }
      } catch {
        // If parsing fails, return generic message
      }
      return { isValid: false, message: 'Invalid phone number format or length' };
    }
    
    return { isValid: true };
  } catch {
    return { isValid: false, message: 'Invalid phone number' };
  }
};

const validateDateOfBirth = (dob: string): { isValid: boolean; message?: string } => {
  if (!dob) return { isValid: false };

  const birthDate = new Date(dob);
  const today = new Date();
  const age = today.getFullYear() - birthDate.getFullYear();

  if (birthDate > today) {
    return { isValid: false, message: 'Date of birth must be in the past' };
  }

  if (age > 120) {
    return { isValid: false, message: 'Invalid date of birth' };
  }

  return { isValid: true };
};

const validateIDDates = (issueDate: string, expiryDate: string): { isValid: boolean; message?: string } => {
  if (!issueDate || !expiryDate) return { isValid: false };

  const issue = new Date(issueDate);
  const expiry = new Date(expiryDate);
  const today = new Date();

  if (issue > today) {
    return { isValid: false, message: 'Issue date cannot be in the future' };
  }

  if (expiry < today) {
    return { isValid: false, message: 'ID/Passport has expired' };
  }

  if (issue >= expiry) {
    return { isValid: false, message: 'Expiry date must be after issue date' };
  }

  return { isValid: true };
};

interface NumberCounterProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
}

function NumberCounter({ value, onChange, min = 0, max = 20 }: NumberCounterProps) {
  return (
    <div className="number-counter">
      <button
        type="button"
        className="number-counter__button"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
      >
        <span>−</span>
      </button>
      <span className="number-counter__value">{value}</span>
      <button
        type="button"
        className="number-counter__button"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
      >
        <span>+</span>
      </button>
    </div>
  );
}

interface DatePickerModalProps {
  isOpen: boolean;
  selectedDate: string;
  selectedReturnDate?: string;
  isRange?: boolean;
  onClose: () => void;
  onSelectDate: (date: string, returnDate?: string) => void;
}

function DatePickerModal({ isOpen, selectedDate, selectedReturnDate, isRange, onClose, onSelectDate }: DatePickerModalProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  // Local state for range selection
  const [tempStartDate, setTempStartDate] = useState(selectedDate);
  const [tempReturnDate, setTempReturnDate] = useState(selectedReturnDate || '');
  const [viewMode, setViewMode] = useState<'calendar' | 'month-year'>('calendar');

  // Reset local state when modal opens
  if (!isOpen && (tempStartDate !== selectedDate || tempReturnDate !== (selectedReturnDate || ''))) {
    // This effect logic should be inside useEffect ideally, but for this component structure:
    // We'll rely on initializing when isOpen becomes true, or just sync on render if simple.
  }

  // Sync state when modal opens
  const [prevIsOpen, setPrevIsOpen] = useState(false);
  if (isOpen && !prevIsOpen) {
    setTempStartDate(selectedDate);
    setTempReturnDate(selectedReturnDate || '');
    setViewMode('calendar');
    setPrevIsOpen(true);
  } else if (!isOpen && prevIsOpen) {
    setPrevIsOpen(false);
  }

  if (!isOpen) return null;

  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return 'Select date';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: (number | null)[] = [];

    // Add empty slots for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }

    return days;
  };

  const handleDateClick = (day: number) => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    // Use UTC to avoid timezone issues with string conversion
    const date = new Date(Date.UTC(year, month, day));
    const dateStr = date.toISOString().split('T')[0];

    if (!isRange) {
      onSelectDate(dateStr);
      onClose();
      return;
    }

    // Range Selection Logic
    if (!tempStartDate || (tempStartDate && tempReturnDate)) {
      // Start new selection
      setTempStartDate(dateStr);
      setTempReturnDate('');
    } else {
      // Complete selection
      if (new Date(dateStr) < new Date(tempStartDate)) {
        // If clicked date is before start date, swap them or reset
        setTempStartDate(dateStr);
        setTempReturnDate('');
      } else {
        setTempReturnDate(dateStr);
        // Auto-confirm or wait for OK? Let's auto-confirm for smoother UX or keep OK
      }
    }
  };

  const isDateSelected = (day: number) => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const currentStr = new Date(Date.UTC(year, month, day)).toISOString().split('T')[0];

    if (isRange) {
      if (currentStr === tempStartDate) return 'start';
      if (currentStr === tempReturnDate) return 'end';
      if (tempStartDate && tempReturnDate && currentStr > tempStartDate && currentStr < tempReturnDate) return 'in-range';
      return '';
    }
    return currentStr === selectedDate ? 'selected' : '';
  };

  const handleMonthYearSelect = (month: number, year: number) => {
    setCurrentMonth(new Date(year, month, 1));
    setViewMode('calendar');
  };

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const handleConfirm = () => {
    if (isRange) {
      if (tempStartDate && tempReturnDate) {
        onSelectDate(tempStartDate, tempReturnDate);
        onClose();
      } else if (tempStartDate) {
        // Allow selecting just start date initially? Or force return date?
        // For now, require both
        alert('Please select a return date');
      }
    } else {
      // Should not happen as single date closes on click
      onClose();
    }
  };

  const days = getDaysInMonth(currentMonth);
  const weeks: (number | null)[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  const monthYear = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const currentYear = currentMonth.getFullYear();

  // Generate years for month/year view (current year - 1 to current year + 5)
  const years = Array.from({ length: 7 }, (_, i) => currentYear - 1 + i);
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <>
      <div className="date-picker-overlay" onClick={onClose} />
      <div className="date-picker-modal">
        <div className="date-picker-modal__header">
          <div className="date-picker-modal__header-content">
            <div className="date-picker-modal__label">
              {isRange ? 'Select Dates' : 'Select date'}
            </div>
            <div className="date-picker-modal__selected-date">
              {isRange ? (
                <>
                  {formatDisplayDate(tempStartDate)}
                  {tempReturnDate && ` - ${formatDisplayDate(tempReturnDate)}`}
                </>
              ) : (
                formatDisplayDate(selectedDate)
              )}
            </div>
          </div>
          <button type="button" className="date-picker-modal__close-btn" onClick={onClose}>
            <CloseIcon />
          </button>
        </div>

        {viewMode === 'calendar' ? (
          <>
            <div className="date-picker-modal__month-selector">
              <button
                type="button"
                className="date-picker-modal__month-btn"
                onClick={() => setViewMode('month-year')}
              >
                <span>{monthYear}</span>
                <ChevronDown />
              </button>
              <div className="date-picker-modal__month-controls">
                <button type="button" className="date-picker-modal__nav-btn" onClick={handlePrevMonth}>
                  <ChevronLeft />
                </button>
                <button type="button" className="date-picker-modal__nav-btn" onClick={handleNextMonth}>
                  <ChevronRight />
                </button>
              </div>
            </div>

            <div className="date-picker-modal__calendar">
              <div className="date-picker-modal__weekdays">
                <div>S</div>
                <div>M</div>
                <div>T</div>
                <div>W</div>
                <div>T</div>
                <div>F</div>
                <div>S</div>
              </div>

              {weeks.map((week, weekIndex) => (
                <div key={weekIndex} className="date-picker-modal__week">
                  {week.map((day, dayIndex) => {
                    const selectionState = day ? isDateSelected(day) : '';
                    return (
                      <div key={dayIndex} className={`date-picker-modal__day ${!day ? 'date-picker-modal__day--empty' : ''} ${selectionState ? `date-picker-modal__day--${selectionState}` : ''}`}>
                        <button
                          type="button"
                          onClick={() => day && handleDateClick(day)}
                          className={selectionState === 'selected' || selectionState === 'start' || selectionState === 'end' ? 'selected' : ''}
                          disabled={!day}
                        >
                          {day || ''}
                        </button>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="date-picker-modal__month-year-view">
            <div className="month-year-grid">
              {years.map(year => (
                <div key={year} className="month-year-grid__year-section">
                  <div className="month-year-grid__year-label">{year}</div>
                  <div className="month-year-grid__months">
                    {months.map((month, index) => (
                      <button
                        type="button"
                        key={month}
                        className={`month-year-grid__month-btn ${currentMonth.getMonth() === index && currentMonth.getFullYear() === year ? 'current' : ''
                          }`}
                        onClick={() => handleMonthYearSelect(index, year)}
                      >
                        {month.slice(0, 3)}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="date-picker-modal__actions">
          <div></div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button type="button" className="date-picker-modal__action-btn" onClick={onClose}>Cancel</button>
            <button type="button" className="date-picker-modal__action-btn" onClick={handleConfirm}>OK</button>
          </div>
        </div>
      </div>
    </>
  );
}

interface GuestInfo {
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
  note?: string; // Optional field
}

interface BookingFormProps {
  tourId: string;
  tourType: 'day-tour' | 'overnight-tour';
  adultPrice: number;
  childPrice: number;
  infantPrice: number;
  onSubmit: (data: {
    date: string;
    returnDate?: string;
    time?: string;
    adults: number;
    children: number;
    infants: number;
    guests: GuestInfo[];
  }) => void;
  currentStep: number;
  onStepChange: (step: number) => void;
  onPriceChange?: (price: number) => void;
}

const BOOKING_STEPS = [
  { id: 1, label: 'Date & Time' },
  { id: 2, label: 'Guests Amount' },
  { id: 3, label: 'Guest Info' },
  { id: 4, label: 'Payment' },
];

const emptyGuestInfo: GuestInfo = {
  firstName: '',
  lastName: '',
  gender: '',
  dateOfBirth: '',
  citizenship: '',
  residence: '',
  phone: '',
  email: '',
  idNumber: '',
  issueDate: '',
  expiryDate: '',
  issuingAuthority: '',
};

// export default function BookingForm({ tourId, tourType, adultPrice, childPrice, infantPrice, onSubmit }: BookingFormProps) {
export default function BookingForm({
  tourType,
  adultPrice,
  childPrice,
  infantPrice,
  currentStep,
  onStepChange,
  onPriceChange,
  onSubmit
}: BookingFormProps) {
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedReturnDate, setSelectedReturnDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('08:00'); // Default time
  const [showDatePicker, setShowDatePicker] = useState(false);
  // const [datePickerMode, setDatePickerMode] = useState<'start' | 'return'>('start');
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [infants, setInfants] = useState(0);
  const [rooms, setRooms] = useState([{ adults: 1, children: 0, infants: 0 }]);
  const [guests, setGuests] = useState<GuestInfo[]>([{ ...emptyGuestInfo }]);
  const [guestErrors, setGuestErrors] = useState<{ [guestIndex: number]: { [field: string]: boolean } }>({});
  const [guestErrorMessages, setGuestErrorMessages] = useState<{ [guestIndex: number]: { [field: string]: string } }>({});

  const totalGuests = tourType === 'overnight-tour'
    ? rooms.reduce((sum, room) => sum + room.adults + room.children + room.infants, 0)
    : adults + children + infants;

  useEffect(() => {
    const calculatePrice = () => {
      if (tourType === 'overnight-tour') {
        return rooms.reduce((sum, room) =>
          sum + (room.adults * adultPrice) + (room.children * childPrice) + (room.infants * infantPrice), 0);
      }
      return (adults * adultPrice) + (children * childPrice) + (infants * infantPrice);
    };

    const newPrice = calculatePrice();
    onPriceChange?.(newPrice);
  }, [tourType, rooms, adults, children, infants, adultPrice, childPrice, infantPrice, onPriceChange]);

  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString('vi-VN').replace(/,/g, '.');
  };

  const handleNextStep = () => {
    // Validation for Step 1
    if (currentStep === 1) {
      if (!selectedDate) return;
      if (tourType === 'overnight-tour' && !selectedReturnDate) return;
    }

    if (currentStep === 2) {
      // Initialize guests array based on total count
      setGuests(prevGuests => {
        const newGuests = [...prevGuests];
        if (totalGuests > newGuests.length) {
          const guestsToAdd = totalGuests - newGuests.length;
          for (let i = 0; i < guestsToAdd; i++) {
            newGuests.push({ ...emptyGuestInfo });
          }
        } else if (totalGuests < newGuests.length) {
          newGuests.splice(totalGuests);
        }
        return newGuests;
      });
    }

    // Ensure state update is processed
    setTimeout(() => {
      const nextStep = Math.min(currentStep + 1, 4);
      onStepChange(nextStep);
    }, 0);
  };

  const handlePrevStep = () => {
    // Clear errors when going back
    setGuestErrors({});
    setGuestErrorMessages({});

    setTimeout(() => {
      const prevStep = Math.max(currentStep - 1, 1);
      onStepChange(prevStep);
    }, 0);
  };

  const updateGuestInfo = (index: number, field: keyof GuestInfo, value: string) => {
    const newGuests = [...guests];
    newGuests[index] = { ...newGuests[index], [field]: value };
    setGuests(newGuests);

    const g = newGuests[index];
    const newErrors = { ...guestErrors };
    const newErrorMessages = { ...guestErrorMessages };

    if (!newErrors[index]) newErrors[index] = {};
    if (!newErrorMessages[index]) newErrorMessages[index] = {};

    // When citizenship changes, clear phone errors to let user re-enter with new country context
    if (field === 'citizenship') {
      if (index === 0) {
        delete newErrors[index].phone;
        delete newErrorMessages[index].phone;
      }
    }

    if (field === 'firstName' || field === 'lastName') {
      if (value && !validateName(value)) {
        newErrors[index][field] = true;
        newErrorMessages[index][field] = 'Only letters, spaces, hyphens and apostrophes allowed';
      } else {
        delete newErrors[index][field];
        delete newErrorMessages[index][field];
      }
    }

    if (field === 'email' && value) {
      if (!validateEmail(value)) {
        newErrors[index].email = true;
        newErrorMessages[index].email = 'Invalid email format';
      } else {
        delete newErrors[index].email;
        delete newErrorMessages[index].email;
      }
    }

    if (field === 'phone' && value) {
      const phoneValidation = validatePhone(value);
      if (!phoneValidation.isValid) {
        newErrors[index].phone = true;
        newErrorMessages[index].phone = phoneValidation.message || 'Invalid phone number';
      } else {
        delete newErrors[index].phone;
        delete newErrorMessages[index].phone;
      }
    }

    if (field === 'dateOfBirth' && value) {
      const dobValidation = validateDateOfBirth(value);
      if (!dobValidation.isValid) {
        newErrors[index].dateOfBirth = true;
        newErrorMessages[index].dateOfBirth = dobValidation.message || 'Invalid date';
      } else {
        delete newErrors[index].dateOfBirth;
        delete newErrorMessages[index].dateOfBirth;
      }
    }

    if ((field === 'issueDate' || field === 'expiryDate') && g.issueDate && g.expiryDate) {
      const dateValidation = validateIDDates(g.issueDate, g.expiryDate);
      if (!dateValidation.isValid) {
        newErrors[index].issueDate = true;
        newErrors[index].expiryDate = true;
        newErrorMessages[index].expiryDate = dateValidation.message || 'Invalid dates';
      } else {
        delete newErrors[index].issueDate;
        delete newErrors[index].expiryDate;
        delete newErrorMessages[index].issueDate;
        delete newErrorMessages[index].expiryDate;
      }
    }

    if (Object.keys(newErrors[index]).length === 0) delete newErrors[index];
    if (Object.keys(newErrorMessages[index]).length === 0) delete newErrorMessages[index];

    setGuestErrors(newErrors);
    setGuestErrorMessages(newErrorMessages);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation for Step 3 (Guest Info)
    if (currentStep === 3) {
      // Validate Guest Info
      const errors: { [guestIndex: number]: { [field: string]: boolean } } = {};
      const errorMessages: string[] = [];
      let hasError = false;

      for (let i = 0; i < guests.length; i++) {
        const g = guests[i];
        const guestErrorFields: { [field: string]: boolean } = {};
        const guestLabel = i === 0 ? 'Primary Guest' : `Guest ${i + 1}`;

        if (!g.firstName || !validateName(g.firstName)) {
          guestErrorFields.firstName = true;
          if (g.firstName && !validateName(g.firstName)) {
            errorMessages.push(`${guestLabel}: Invalid first name`);
          }
        }

        if (!g.lastName || !validateName(g.lastName)) {
          guestErrorFields.lastName = true;
          if (g.lastName && !validateName(g.lastName)) {
            errorMessages.push(`${guestLabel}: Invalid last name`);
          }
        }

        if (!g.gender) guestErrorFields.gender = true;

        if (!g.dateOfBirth) {
          guestErrorFields.dateOfBirth = true;
        } else {
          const dobValidation = validateDateOfBirth(g.dateOfBirth);
          if (!dobValidation.isValid) {
            guestErrorFields.dateOfBirth = true;
            errorMessages.push(`${guestLabel}: ${dobValidation.message}`);
          }
        }

        if (!g.citizenship) guestErrorFields.citizenship = true;
        if (!g.residence) guestErrorFields.residence = true;

        if (!g.idNumber) {
          guestErrorFields.idNumber = true;
        }

        if (!g.issueDate) {
          guestErrorFields.issueDate = true;
        }
        if (!g.expiryDate) {
          guestErrorFields.expiryDate = true;
        }

        if (g.issueDate && g.expiryDate) {
          const dateValidation = validateIDDates(g.issueDate, g.expiryDate);
          if (!dateValidation.isValid) {
            guestErrorFields.issueDate = true;
            guestErrorFields.expiryDate = true;
            errorMessages.push(`${guestLabel}: ${dateValidation.message}`);
          }
        }

        if (!g.issuingAuthority) guestErrorFields.issuingAuthority = true;

        // Phone and email only required for primary guest (index 0)
        if (i === 0) {
          if (!g.phone) {
            guestErrorFields.phone = true;
          } else {
            const phoneValidation = validatePhone(g.phone);
            if (!phoneValidation.isValid) {
              guestErrorFields.phone = true;
              errorMessages.push(`${guestLabel}: ${phoneValidation.message}`);
            }
          }

          if (!g.email) {
            guestErrorFields.email = true;
          } else if (!validateEmail(g.email)) {
            guestErrorFields.email = true;
            errorMessages.push(`${guestLabel}: Invalid email address`);
          }
        }

        if (Object.keys(guestErrorFields).length > 0) {
          errors[i] = guestErrorFields;
          hasError = true;
        }
      }

      if (hasError) {
        setGuestErrors(errors);
        const message = errorMessages.length > 0
          ? 'Please fix the following errors:\n\n' + errorMessages.join('\n')
          : 'Please fill in all required fields for all guests';
        alert(message);
        return;
      }

      // Submit form
      onSubmit({
        date: selectedDate,
        returnDate: selectedReturnDate,
        time: selectedTime,
        adults: tourType === 'overnight-tour' ? rooms.reduce((sum, r) => sum + r.adults, 0) : adults,
        children: tourType === 'overnight-tour' ? rooms.reduce((sum, r) => sum + r.children, 0) : children,
        infants: tourType === 'overnight-tour' ? rooms.reduce((sum, r) => sum + r.infants, 0) : infants,
        guests,
      });
      return;
    }
  };

  const addRoom = () => {
    setRooms([...rooms, { adults: 1, children: 0, infants: 0 }]);
  };

  const updateRoom = (index: number, field: 'adults' | 'children' | 'infants', value: number) => {
    const newRooms = [...rooms];
    newRooms[index] = { ...newRooms[index], [field]: value };
    setRooms(newRooms);
  };

  return (
    <form id="booking-form" className="booking-form" onSubmit={handleSubmit}>
      <BookingSteps
        steps={BOOKING_STEPS}
        currentStep={currentStep}
        selectedDate={tourType === 'overnight-tour' && selectedReturnDate
          ? `${formatDisplayDate(selectedDate)} - ${formatDisplayDate(selectedReturnDate)}`
          : formatDisplayDate(selectedDate)}
        guestCount={totalGuests}
        onStepClick={(stepId) => onStepChange(stepId)}
      />

      {/* Step 1: Date & Time */}
      {currentStep === 1 && (
        <div className="booking-form__section">
          <div className="date-time-section">
            <div className="date-time-section__picker">
              <label className="date-time-section__label">Check availability:</label>
              <div className="date-time-section__input-wrapper date-time-section__input-wrapper--combined">
                <input
                  type="text"
                  value={
                    tourType === 'overnight-tour' && selectedReturnDate
                      ? `${formatDisplayDate(selectedDate)} - ${formatDisplayDate(selectedReturnDate)}`
                      : formatDisplayDate(selectedDate)
                  }
                  onClick={() => setShowDatePicker(true)}
                  readOnly
                  placeholder={tourType === 'overnight-tour' ? "Select dates" : "DD/MM/YYYY"}
                />

                <div className="date-time-section__time-wrapper">
                  <select
                    className="date-time-section__time-select"
                    value={selectedTime}
                    onChange={(e) => setSelectedTime(e.target.value)}
                  >
                    <option value="07:00">07:00</option>
                    <option value="07:30">07:30</option>
                    <option value="08:00">08:00</option>
                    <option value="08:30">08:30</option>
                    <option value="09:00">09:00</option>
                    <option value="09:30">09:30</option>
                    <option value="10:00">10:00</option>
                    <option value="13:00">13:00</option>
                    <option value="13:30">13:30</option>
                    <option value="14:00">14:00</option>
                    <option value="17:00">17:00</option>
                    <option value="18:00">18:00</option>
                    <option value="19:00">19:00</option>
                  </select>
                </div>

                <div className="date-time-section__icon">
                  <div className="icon-container">
                    <CalendarIcon />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="booking-form__actions">
            <button
              type="button"
              className="btn-primary"
              onClick={handleNextStep}
              disabled={!selectedDate || (tourType === 'overnight-tour' && !selectedReturnDate)}
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Guest Amount - Day Tour */}
      {currentStep === 2 && tourType === 'day-tour' && (
        <div className="booking-form__section">
          <div className="guest-amount-section guest-amount-section--day-tour">
            <label className="guest-amount-section__label">Party Size</label>
            <div className="guest-amount-section__items">
              <div className="guest-amount-section__item">
                <div className="guest-amount-section__item-info">
                  <div className="guest-amount-section__item-label">
                    Adult <span>(Aged 13+)</span>
                  </div>
                  <NumberCounter value={adults} onChange={setAdults} min={1} max={20} />
                </div>
                <div className="guest-amount-section__item-price">
                  {formatPrice(adultPrice)} VND
                </div>
              </div>

              <div className="guest-amount-section__item">
                <div className="guest-amount-section__item-info">
                  <div className="guest-amount-section__item-label">
                    Children <span>(Aged 4-12)</span>
                  </div>
                  <NumberCounter value={children} onChange={setChildren} min={0} max={20} />
                </div>
                <div className="guest-amount-section__item-price">
                  {formatPrice(childPrice)} VND
                </div>
              </div>

              <div className="guest-amount-section__item">
                <div className="guest-amount-section__item-info">
                  <div className="guest-amount-section__item-label">
                    Infant <span>(Aged 0-3)</span>
                  </div>
                  <NumberCounter value={infants} onChange={setInfants} min={0} max={20} />
                </div>
                <div className="guest-amount-section__item-price">
                  Free of charge
                </div>
              </div>
            </div>
          </div>

          <div className="booking-form__actions" style={{ gap: '16px' }}>
            <button type="button" className="btn-secondary" onClick={handlePrevStep}>
              Back
            </button>
            <button type="button" className="btn-primary" onClick={handleNextStep}>
              Continue
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Guest Amount - Overnight Tour */}
      {currentStep === 2 && tourType === 'overnight-tour' && (
        <div className="booking-form__section">
          <div className="guest-amount-section guest-amount-section--overnight-tour">
            <label className="guest-amount-section__label">Guest Amount</label>
            <div className="guest-amount-section__items">
              {rooms.map((room, index) => (
                <div key={index} className="guest-amount-section__room">
                  <div className="guest-amount-section__room-title">
                    Room {index + 1} Configuration
                  </div>

                  <div className="guest-amount-section__room-guests">
                    <div className="guest-amount-section__room-row guest-amount-section__room-row--two-cols">
                      <div>
                        <span className="guest-amount-section__room-label">
                          Adults (Aged 18+)
                        </span>
                        <NumberCounter
                          value={room.adults}
                          onChange={(val) => updateRoom(index, 'adults', val)}
                          min={1}
                          max={10}
                        />
                      </div>
                      <div>
                        <span className="guest-amount-section__room-label">
                          Children (Aged 4-12)
                        </span>
                        <NumberCounter
                          value={room.children}
                          onChange={(val) => updateRoom(index, 'children', val)}
                          min={0}
                          max={10}
                        />
                      </div>
                    </div>

                    <div className="guest-amount-section__room-row">
                      <span className="guest-amount-section__room-label">
                        Infant (Aged 0-3)
                      </span>
                      <NumberCounter
                        value={room.infants}
                        onChange={(val) => updateRoom(index, 'infants', val)}
                        min={0}
                        max={10}
                      />
                    </div>
                  </div>

                  <div className="guest-amount-section__room-total">
                    <span className="label">Starting from</span>
                    <span className="price">{formatPrice(room.adults * adultPrice + room.children * childPrice)} VND</span>
                  </div>
                </div>
              ))}

              <button type="button" className="guest-amount-section__add-room" onClick={addRoom}>
                <span className="label">Add another room</span>
              </button>
            </div>
          </div>

          <div className="booking-form__actions" style={{ gap: '16px' }}>
            <button type="button" className="btn-secondary" onClick={handlePrevStep}>
              Back
            </button>
            <button type="button" className="btn-primary" onClick={handleNextStep}>
              Continue
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Guest Info - Same as before */}
      {currentStep === 3 && (
        <div className="booking-form__section">
          <p className="booking-form__notice">
            (*) The details you provide for all guests must match their government-issued photo IDs.
          </p>

          {guests.map((guest, index) => (
            <div key={index} className="guest-form">
              <div className="guest-form__header">
                <h3 className="guest-form__title">
                  {index === 0 ? 'Primary Guest' : `Guest ${index + 1}`}
                </h3>
                {index === 0 && (
                  <p className="guest-form__description">
                    We will use this information to send you confirmation and updates about your booking
                  </p>
                )}
              </div>

              <div className="guest-form__fields">
                {/* Row 1: Names */}
                <div className="guest-form__row">
                  <div className="form-field">
                    <label className="form-field__label">First legal name</label>
                    <input
                      type="text"
                      className={`form-field__input ${guestErrors[index]?.firstName ? 'form-field__input--error' : ''}`}
                      placeholder="Enter your first name"
                      value={guest.firstName}
                      onChange={(e) => updateGuestInfo(index, 'firstName', e.target.value)}
                    />
                    {guestErrorMessages[index]?.firstName && (
                      <span className="form-field__error">{guestErrorMessages[index].firstName}</span>
                    )}
                  </div>
                  <div className="form-field">
                    <label className="form-field__label">Last legal name</label>
                    <input
                      type="text"
                      className={`form-field__input ${guestErrors[index]?.lastName ? 'form-field__input--error' : ''}`}
                      placeholder="Enter your last name"
                      value={guest.lastName}
                      onChange={(e) => updateGuestInfo(index, 'lastName', e.target.value)}
                    />
                    {guestErrorMessages[index]?.lastName && (
                      <span className="form-field__error">{guestErrorMessages[index].lastName}</span>
                    )}
                  </div>
                </div>

                {/* Row 2: Gender & DOB */}
                <div className="guest-form__row">
                  <div className="form-field">
                    <label className="form-field__label">Gender</label>
                    <select
                      className={`form-field__select ${guestErrors[index]?.gender ? 'form-field__input--error' : ''}`}
                      value={guest.gender}
                      onChange={(e) => updateGuestInfo(index, 'gender', e.target.value)}
                    >
                      <option value="">Select</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div className="form-field">
                    <label className="form-field__label">Date of birth</label>
                    <div className="form-field__input-wrapper">
                      <input
                        type="date"
                        className={`form-field__input form-field__input--date ${guestErrors[index]?.dateOfBirth ? 'form-field__input--error' : ''}`}
                        placeholder="DD/MM/YYYY"
                        value={guest.dateOfBirth}
                        onChange={(e) => updateGuestInfo(index, 'dateOfBirth', e.target.value)}
                      />
                      <span className="form-field__icon">
                        <CalendarIcon />
                      </span>
                    </div>
                    {guestErrorMessages[index]?.dateOfBirth && (
                      <span className="form-field__error">{guestErrorMessages[index].dateOfBirth}</span>
                    )}
                  </div>
                </div>

                {/* Row 3: Countries */}
                <div className="guest-form__row">
                  <div className="form-field">
                    <label className="form-field__label">Country of Citizenship</label>
                    <select
                      className={`form-field__select ${guestErrors[index]?.citizenship ? 'form-field__input--error' : ''}`}
                      value={guest.citizenship}
                      onChange={(e) => updateGuestInfo(index, 'citizenship', e.target.value)}
                    >
                      <option value="">Select</option>
                      <option value="VN">Vietnam</option>
                      <option value="US">United States</option>
                      <option value="UK">United Kingdom</option>
                      <option value="JP">Japan</option>
                      <option value="KR">South Korea</option>
                      <option value="AU">Australia</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>
                  <div className="form-field">
                    <label className="form-field__label">Country of Residence</label>
                    <select
                      className={`form-field__select ${guestErrors[index]?.residence ? 'form-field__input--error' : ''}`}
                      value={guest.residence}
                      onChange={(e) => updateGuestInfo(index, 'residence', e.target.value)}
                    >
                      <option value="">Select</option>
                      <option value="VN">Vietnam</option>
                      <option value="US">United States</option>
                      <option value="UK">United Kingdom</option>
                      <option value="JP">Japan</option>
                      <option value="KR">South Korea</option>
                      <option value="AU">Australia</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>
                </div>

                {/* Row 4: Contact Info (Primary Guest Only) */}
                {index === 0 && (
                  <div className="guest-form__row">
                    <div className="form-field form-field--phone">
                      <label className="form-field__label">Phone numbers</label>
                      <PhoneInput
                        key={guest.citizenship || 'default'} // Force re-render when citizenship changes
                        defaultCountry={(guest.citizenship && guest.citizenship !== 'OTHER' ? guest.citizenship.toLowerCase() : 'vn') as string}
                        value={guest.phone}
                        onChange={(phone) => updateGuestInfo(index, 'phone', phone)}
                        className={guestErrors[index]?.phone ? 'phone-input--error' : ''}
                        hideDropdown={false}
                        disableDialCodeAndPrefix={false}
                        forceDialCode={true}
                      />
                      {guestErrorMessages[index]?.phone && (
                        <span className="form-field__error">{guestErrorMessages[index].phone}</span>
                      )}
                    </div>
                    <div className="form-field">
                      <label className="form-field__label">Email address</label>
                      <input
                        type="email"
                        className={`form-field__input ${guestErrors[index]?.email ? 'form-field__input--error' : ''}`}
                        placeholder="Enter your email address"
                        value={guest.email}
                        onChange={(e) => updateGuestInfo(index, 'email', e.target.value)}
                      />
                      {guestErrorMessages[index]?.email && (
                        <span className="form-field__error">{guestErrorMessages[index].email}</span>
                      )}
                    </div>
                  </div>
                )}

                {/* Row 5: ID Number */}
                <div className="guest-form__row guest-form__row--full">
                  <div className="form-field">
                    <label className="form-field__label">National ID Number | Passport Number</label>
                    <input
                      type="text"
                      className={`form-field__input ${guestErrors[index]?.idNumber ? 'form-field__input--error' : ''}`}
                      value={guest.idNumber}
                      onChange={(e) => updateGuestInfo(index, 'idNumber', e.target.value)}
                    />
                  </div>
                </div>

                {/* Row 6: ID Dates */}
                <div className="guest-form__row guest-form__row--thirds">
                  <div className="form-field">
                    <label className="form-field__label">Issue Date</label>
                    <div className="form-field__input-wrapper">
                      <input
                        type="date"
                        className={`form-field__input form-field__input--date ${guestErrors[index]?.issueDate ? 'form-field__input--error' : ''}`}
                        placeholder="DD/MM/YYYY"
                        value={guest.issueDate}
                        onChange={(e) => updateGuestInfo(index, 'issueDate', e.target.value)}
                      />
                      <span className="form-field__icon">
                        <CalendarIcon />
                      </span>
                    </div>
                    {guestErrorMessages[index]?.issueDate && (
                      <span className="form-field__error">{guestErrorMessages[index].issueDate}</span>
                    )}
                  </div>
                  <div className="form-field">
                    <label className="form-field__label">Expiry Date</label>
                    <div className="form-field__input-wrapper">
                      <input
                        type="date"
                        className={`form-field__input form-field__input--date ${guestErrors[index]?.expiryDate ? 'form-field__input--error' : ''}`}
                        placeholder="DD/MM/YYYY"
                        value={guest.expiryDate}
                        onChange={(e) => updateGuestInfo(index, 'expiryDate', e.target.value)}
                      />
                      <span className="form-field__icon">
                        <CalendarIcon />
                      </span>
                    </div>
                    {guestErrorMessages[index]?.expiryDate && (
                      <span className="form-field__error">{guestErrorMessages[index].expiryDate}</span>
                    )}
                  </div>
                  <div className="form-field">
                    <label className="form-field__label">Issuing Authority</label>
                    <input
                      type="text"
                      className={`form-field__input ${guestErrors[index]?.issuingAuthority ? 'form-field__input--error' : ''}`}
                      value={guest.issuingAuthority}
                      onChange={(e) => updateGuestInfo(index, 'issuingAuthority', e.target.value)}
                    />
                  </div>
                </div>

                {/* Row 7: Note */}
                <div className="guest-form__row">
                  <div className="form-field form-field--full">
                    <label className="form-field__label">Note</label>
                    <textarea
                      className="form-field__input form-field__textarea"
                      placeholder="Any dietary requirements (e.g. vegetarian/vegan, allergies), health conditions, mobility limitations, or any special requests."
                      value={guest.note || ''}
                      onChange={(e) => updateGuestInfo(index, 'note', e.target.value)}
                      rows={3}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <DatePickerModal
        isOpen={showDatePicker}
        selectedDate={selectedDate}
        selectedReturnDate={selectedReturnDate}
        isRange={tourType === 'overnight-tour'}
        onClose={() => setShowDatePicker(false)}
        onSelectDate={(date, returnDate) => {
          setSelectedDate(date);
          if (returnDate) setSelectedReturnDate(returnDate);
          else if (tourType !== 'overnight-tour') setSelectedReturnDate(''); // Clear return date if single selection mode
          setShowDatePicker(false);
        }}
      />
    </form>
  );
}
