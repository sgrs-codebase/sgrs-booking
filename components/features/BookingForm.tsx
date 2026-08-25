'use client';

import { useState, useEffect, useCallback } from 'react';
import BookingSteps from './BookingSteps';
import { PhoneInput } from 'react-international-phone';
import 'react-international-phone/style.css';
import { isPossiblePhoneNumber, parsePhoneNumber } from 'libphonenumber-js';

// Calendar Icon SVG (New version matching design)
const CalendarIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M19 4H5C3.89543 4 3 4.89543 3 6V20C3 21.1046 3.89543 22 5 22H19C20.1046 22 21 21.1046 21 20V6C21 4.89543 20.1046 4 19 4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M16 2V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M8 2V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M3 10H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="12" cy="16" r="2" fill="currentColor" />
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
  availabilityMap?: { [date: string]: { total: number; booked: number; available: number; times: string[] } };
  tourId: string;
  selectedTime: string;
  startTimes?: string[];
  onSelectTime?: (time: string) => void;
}

function DatePickerModal({ isOpen, selectedDate, selectedReturnDate, isRange, onClose, onSelectDate, availabilityMap, tourId, selectedTime, startTimes = ['08:00'], onSelectTime }: DatePickerModalProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  // Local state for range selection
  const [tempStartDate, setTempStartDate] = useState(selectedDate);
  const [tempReturnDate, setTempReturnDate] = useState(selectedReturnDate || '');
  const [tempSelectedTime, setTempSelectedTime] = useState(selectedTime);
  const [detailedAvailability, setDetailedAvailability] = useState<AvailabilityData | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);

  const getDefaultOpenDate = useCallback(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return Object.keys(availabilityMap ?? {})
      .filter((dateStr) => {
        const date = new Date(dateStr);
        return !Number.isNaN(date.getTime()) && date >= today;
      })
      .sort()[0] ?? '';
  }, [availabilityMap]);

  // Sync state when modal opens
  const [prevIsOpen, setPrevIsOpen] = useState(false);
  useEffect(() => {
    if (isOpen && !prevIsOpen) {
      const initialDate = selectedDate || getDefaultOpenDate();
      const initialTimes = initialDate
        ? (availabilityMap?.[initialDate]?.times ?? startTimes)
        : startTimes;

      setTempStartDate(initialDate);
      setTempReturnDate(selectedReturnDate || '');
      setTempSelectedTime(initialTimes?.[0] || selectedTime || '08:00');
      setDetailedAvailability(null);
      setCurrentMonth(initialDate ? new Date(initialDate) : new Date());
      setPrevIsOpen(true);
    } else if (!isOpen && prevIsOpen) {
      setPrevIsOpen(false);
    }
  }, [availabilityMap, getDefaultOpenDate, isOpen, prevIsOpen, selectedDate, selectedReturnDate, selectedTime, startTimes]);

  // Fetch detailed availability when tempStartDate or tempSelectedTime changes
  useEffect(() => {
    const fetchDetail = async () => {
      if (!tempStartDate || !isOpen) {
        setDetailedAvailability(null);
        return;
      }
      setIsDetailLoading(true);
      try {
        const res = await fetch(`/api/tours/availability?tourId=${tourId}&date=${tempStartDate}&time=${tempSelectedTime}`);
        if (res.ok) {
          const data = await res.json();
          setDetailedAvailability(data);
        } else {
          setDetailedAvailability(null);
        }
      } catch (error) {
        console.error('Failed to fetch detail:', error);
        setDetailedAvailability(null);
      } finally {
        setIsDetailLoading(false);
      }
    };
    fetchDetail();
  }, [tempStartDate, tourId, isOpen, tempSelectedTime]);

  if (!isOpen) return null;

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: (number | null)[] = [];
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }
    return days;
  };

  const handleDateClick = (day: number) => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(year, month, day);
    if (checkDate < today || !availabilityMap?.[dateStr]) return;

    if (!isRange) {
      setTempStartDate(dateStr);
      // Update tempSelectedTime to the first available time for this date
      const nextTimes = availabilityMap?.[dateStr]?.times;
      if (nextTimes && nextTimes.length > 0) {
        setTempSelectedTime(nextTimes[0]);
      } else {
        setTempSelectedTime(startTimes[0] || '08:00');
      }
      // Don't close immediately, let user see right panel
      return;
    }

    // Range Selection Logic
    if (!tempStartDate || (tempStartDate && tempReturnDate)) {
      setTempStartDate(dateStr);
      setTempReturnDate('');
    } else {
      if (new Date(dateStr) < new Date(tempStartDate)) {
        setTempStartDate(dateStr);
        setTempReturnDate('');
      } else {
        setTempReturnDate(dateStr);
      }
    }
  };

  const isDateSelected = (day: number) => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const currentStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    if (isRange) {
      if (currentStr === tempStartDate) return 'start';
      if (currentStr === tempReturnDate) return 'end';
      if (tempStartDate && tempReturnDate && currentStr > tempStartDate && currentStr < tempReturnDate) return 'in-range';
      return '';
    }
    return currentStr === tempStartDate ? 'selected' : '';
  };

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const handleConfirm = () => {
    if (onSelectTime) {
      onSelectTime(tempSelectedTime);
    }
    if (isRange) {
      if (tempStartDate && tempReturnDate) {
        onSelectDate(tempStartDate, tempReturnDate);
        onClose();
      } else {
        alert('Please select a return date');
      }
    } else if (tempStartDate) {
      onSelectDate(tempStartDate);
      onClose();
    }
  };

  const days = getDaysInMonth(currentMonth);
  const weeks: (number | null)[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  const selectedDateObj = tempStartDate ? new Date(tempStartDate) : null;
  const dayName = selectedDateObj?.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
  const dayNum = selectedDateObj?.getDate();
  const selectedDayAvailability = tempStartDate ? availabilityMap?.[tempStartDate] : undefined;

  // Get times for the currently selected temporary date
  const availableTimes = (selectedDayAvailability?.times?.length ?? 0) > 0
    ? selectedDayAvailability?.times ?? startTimes
    : (startTimes.length > 0 ? startTimes : ['08:00']);

  return (
    <>
      <div className="date-picker-overlay" onClick={onClose} />
      <div className="date-picker-modal-v2">
        <div className="date-picker-modal-v2__left">
          <div className="date-picker-modal-v2__calendar-header">
            <div className="date-picker-modal-v2__month-display">
              <span className="month">{currentMonth.toLocaleDateString('en-US', { month: 'long' })}</span>
              <span className="year">{currentMonth.getFullYear()}</span>
            </div>
            <div className="date-picker-modal-v2__month-nav">
              <button type="button" onClick={handlePrevMonth}><ChevronLeft /></button>
              <button type="button" onClick={handleNextMonth}><ChevronRight /></button>
            </div>
          </div>

          <div className="date-picker-modal-v2__calendar-grid">
            <div className="date-picker-modal-v2__weekdays">
              {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(d => <div key={d}>{d}</div>)}
            </div>

            {weeks.map((week, weekIndex) => (
              <div key={weekIndex} className="date-picker-modal-v2__week">
                {week.map((day, dayIndex) => {
                  const selectionState = day ? isDateSelected(day) : '';
                  const year = currentMonth.getFullYear();
                  const month = currentMonth.getMonth();
                  const dateStr = day ? `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}` : '';
                  const isPast = day ? (new Date(year, month, day).getTime() < new Date().setHours(0, 0, 0, 0)) : false;
                  const hasTour = dateStr && availabilityMap?.[dateStr];

                  return (
                    <div 
                      key={dayIndex} 
                      className={`date-picker-modal-v2__day ${!day ? 'empty' : ''} ${selectionState ? `is-${selectionState}` : ''} ${isPast ? 'is-past' : ''} ${hasTour ? 'has-tour' : ''}`}
                    >
                      {day && (
                        <button
                          type="button"
                          onClick={() => handleDateClick(day)}
                          disabled={isPast || !hasTour}
                        >
                          {day}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          <div className="date-picker-modal-v2__contact-section">
            <p>To book dates outside of SGRS&apos;s departure schedule, please contact the Sales team for assistance.</p>
            <div className="date-picker-modal-v2__contact-pills">
              <a href="tel:+84983912325" className="contact-pill">Hotline</a>
              <a href="https://wa.me/84983912325" target="_blank" rel="noopener noreferrer" className="contact-pill">Whatsapp</a>
              <a href="https://zalo.me/84983912325" target="_blank" rel="noopener noreferrer" className="contact-pill">Zalo</a>
              <a href="mailto:sales@saigonriverstar.com" className="contact-pill">Email</a>
            </div>
          </div>

          <div className="date-picker-modal-v2__timezone">
            Asia/Ho Chi Minh GMT +7:00
          </div>
        </div>

        <div className="date-picker-modal-v2__right">
          <button type="button" className="date-picker-modal-v2__close-x" onClick={onClose}>
            <CloseIcon />
          </button>

          {tempStartDate && (
            <div className="date-picker-modal-v2__selection-info">
              <div className="date-picker-modal-v2__selected-day-large">
                <span className="day-name">{dayName}</span>
                <span className="day-num">{dayNum}</span>
              </div>

              {isDetailLoading ? (
                <div className="date-picker-modal-v2__loading">Checking slots...</div>
              ) : (
                <div className="date-picker-modal-v2__time-slots">
                  {availableTimes.map(time => (
                    <div 
                      key={time}
                      className={`date-picker-modal-v2__time-slot-card ${tempSelectedTime === time ? 'date-picker-modal-v2__time-slot-card--selected' : ''}`}
                      onClick={() => setTempSelectedTime(time)}
                    >
                      <div className="time">{time}</div>
                      <div className="slots">
                        {tempSelectedTime === time && detailedAvailability 
                          ? `${detailedAvailability.availableSlots} Seats available` 
                          : (availabilityMap?.[tempStartDate] ? `${availabilityMap[tempStartDate].available} Seats available` : 'Check availability')}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <button 
                type="button" 
                className="btn-primary date-picker-modal-v2__continue"
                onClick={handleConfirm}
                disabled={isDetailLoading || (!detailedAvailability && !availabilityMap?.[tempStartDate]) || (detailedAvailability?.availableSlots === 0)}
              >
                Continue
              </button>
            </div>
          )}
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
  tourType: 'day-tour' | 'overnight-tour' | string;
  adultPrice: number;
  childPrice: number;
  infantPrice: number;
  startTimes?: string[];
  onSubmit: (data: {
    date: string;
    returnDate?: string;
    time?: string;
    adults: number;
    children: number;
    infants: number;
    guests: GuestInfo[];
    hotelPickup?: string;
    paymentMethod: 'onepay' | 'qr_bank';
  }) => void;
  currentStep: number;
  onStepChange: (step: number) => void;
  onPriceChange?: (price: number) => void;
  isSubmitting?: boolean;
}

interface AvailabilityData {
  totalSlots: number;
  paidSlots: number;
  pendingSlots: number;
  availableSlots: number;
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
  tourId,
  tourType,
  adultPrice,
  childPrice,
  infantPrice,
  startTimes,
  currentStep,
  onStepChange,
  onPriceChange,
  isSubmitting = false,
  onSubmit
}: BookingFormProps) {

  const [selectedDate, setSelectedDate] = useState('');
  const [selectedReturnDate, setSelectedReturnDate] = useState('');
  const [selectedTime, setSelectedTime] = useState(startTimes && startTimes.length > 0 ? startTimes[0] : '08:00'); // Default time from Airtable if available
  const [paymentMethod, setPaymentMethod] = useState<'onepay' | 'qr_bank'>('onepay');
  const [hotelPickup, setHotelPickup] = useState('');
  const [hasCopiedQrAmount, setHasCopiedQrAmount] = useState(false);

  const [availability, setAvailability] = useState<AvailabilityData | null>(null);
  const [isLoadingAvailability, setIsLoadingAvailability] = useState(false);
  const [openDatesMap, setOpenDatesMap] = useState<{ [date: string]: { total: number; booked: number; available: number; times: string[] } }>({});

  const fetchOpenDates = useCallback(async () => {
    try {
      const res = await fetch(`/api/tours/open-dates?tourId=${tourId}`);
      if (res.ok) {
        const data = await res.json();
        const map: { [date: string]: { total: number; booked: number; available: number; times: string[] } } = {};
        data.openDates.forEach((d: { date: string; departure_time?: string; total_slots: number }) => {
          const normalizedDate = normalizeOpenDateKey(d.date);
          if (!normalizedDate) return;

          if (!map[normalizedDate]) {
            map[normalizedDate] = { total: d.total_slots, booked: 0, available: d.total_slots, times: [] };
          }
          if (d.departure_time) {
            map[normalizedDate].times.push(d.departure_time);
          }
        });
        setOpenDatesMap(map);
      }
    } catch (error) {
      console.error('Failed to fetch open dates:', error);
    }
  }, [tourId]);

  useEffect(() => {
    fetchOpenDates();
  }, [fetchOpenDates]);

  const normalizeOpenDateKey = (dateValue: string) => {
    return String(dateValue || '').split('T')[0];
  };

  const fetchAvailability = useCallback(async () => {
    if (!selectedDate) return;

    setIsLoadingAvailability(true);
    try {
      const res = await fetch(`/api/tours/availability?tourId=${tourId}&date=${selectedDate}&time=${selectedTime}`);
      if (res.ok) {
        const data = await res.json();
        setAvailability(data);
      }
    } catch (error) {
      console.error('Failed to fetch availability:', error);
    } finally {
      setIsLoadingAvailability(false);
    }
  }, [selectedDate, selectedTime, tourId]);

  useEffect(() => {
    if (currentStep === 2) {
      fetchAvailability();
    }
  }, [currentStep, fetchAvailability]);


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

  const currentTotalPrice = tourType === 'overnight-tour'
    ? rooms.reduce((sum, room) =>
      sum + (room.adults * adultPrice) + (room.children * childPrice) + (room.infants * infantPrice), 0)
    : (adults * adultPrice) + (children * childPrice) + (infants * infantPrice);

  useEffect(() => {
    onPriceChange?.(currentTotalPrice);
  }, [currentTotalPrice, onPriceChange]);

  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatDateDDMMYYYY = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString('vi-VN').replace(/,/g, '.');
  };

  const qrBankDetails = {
    bankId: 'mb',
    accountNumber: '1234567890',
    merchantName: 'CT TNHH DT VA PT SAI GON RIVER STAR',
  };

  const qrPreviewUrl = '/QR.png';

  const handleCopyQrAmount = async () => {
    try {
      await navigator.clipboard.writeText(`${currentTotalPrice}`);
      setHasCopiedQrAmount(true);
      window.setTimeout(() => setHasCopiedQrAmount(false), 1600);
    } catch (error) {
      console.error('Failed to copy QR amount:', error);
    }
  };

  const handleDownloadQr = () => {
    const link = document.createElement('a');
    link.href = qrPreviewUrl;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.download = 'sgrs-qr-code.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const validateGuestsBeforePayment = () => {
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

      if (!g.idNumber) guestErrorFields.idNumber = true;
      if (!g.issueDate) guestErrorFields.issueDate = true;
      if (!g.expiryDate) guestErrorFields.expiryDate = true;

      if (g.issueDate && g.expiryDate) {
        const dateValidation = validateIDDates(g.issueDate, g.expiryDate);
        if (!dateValidation.isValid) {
          guestErrorFields.issueDate = true;
          guestErrorFields.expiryDate = true;
          errorMessages.push(`${guestLabel}: ${dateValidation.message}`);
        }
      }

      if (!g.issuingAuthority) guestErrorFields.issuingAuthority = true;

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
      return false;
    }

    return true;
  };

  const submitBooking = (selectedPaymentMethod: 'onepay' | 'qr_bank') => {
    const guestsWithDefaults = guests.map(guest => ({
      ...guest,
      note: guest.note && guest.note.trim() ? guest.note : 'None'
    }));

    onSubmit({
      date: selectedDate,
      returnDate: selectedReturnDate,
      time: selectedTime,
      adults: tourType === 'overnight-tour' ? rooms.reduce((sum, r) => sum + r.adults, 0) : adults,
      children: tourType === 'overnight-tour' ? rooms.reduce((sum, r) => sum + r.children, 0) : children,
      infants: tourType === 'overnight-tour' ? rooms.reduce((sum, r) => sum + r.infants, 0) : infants,
      guests: guestsWithDefaults,
      hotelPickup: hotelPickup.trim(),
      paymentMethod: selectedPaymentMethod,
    });
  };

  const handleOnePaySelection = () => {
    if (isSubmitting) return;
    setPaymentMethod('onepay');

    if (!validateGuestsBeforePayment()) {
      return;
    }

    submitBooking('onepay');
  };

  const isSlotExceeded = availability ? (totalGuests > availability.availableSlots) : false;

  const handleNextStep = () => {
    // Validation for Step 1
    if (currentStep === 1) {
      if (!selectedDate) return;
      if (tourType === 'overnight-tour' && !selectedReturnDate) return;
    }

    if (currentStep === 2) {
      // Re-check availability before moving to step 3
      fetchAvailability();
      if (isSlotExceeded) {
        alert(`Sorry, only ${availability?.availableSlots} slots available for this date.`);
        return;
      }
      
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
    if (currentStep === 3 || currentStep === 4) {
      if (!validateGuestsBeforePayment()) {
        return;
      }

      // If we are in step 3 and everything is valid, move to step 4
      if (currentStep === 3) {
        onStepChange(4);
        return;
      }

      if (currentStep === 4) {
        submitBooking(paymentMethod);
      }
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

  const handleAutofill = () => {
    const testGuests = guests.map((_, index) => ({
      firstName: `Guest`,
      lastName: `Tester`,
      gender: index % 2 === 0 ? 'male' : 'female',
      dateOfBirth: '1990-01-01',
      citizenship: 'VN',
      residence: 'VN',
      phone: index === 0 ? '+84983912325' : '',
      email: index === 0 ? 'test@example.com' : '',
      idNumber: '123456789',
      issueDate: '2020-01-01',
      expiryDate: '2030-01-01',
      issuingAuthority: 'Police',
      note: 'Test autofill'
    }));
    setGuests(testGuests);
    setGuestErrors({});
    setGuestErrorMessages({});
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
              <div 
                className="date-time-section__input-wrapper date-time-section__input-wrapper--combined"
                onClick={() => setShowDatePicker(true)}
                style={{ cursor: 'pointer' }}
              >
                <div className="date-time-section__display-value">
                  {selectedDate ? (
                    tourType === 'overnight-tour' && selectedReturnDate
                      ? `${formatDateDDMMYYYY(selectedDate)} - ${formatDateDDMMYYYY(selectedReturnDate)}`
                      : formatDateDDMMYYYY(selectedDate)
                  ) : (
                    "DD/MM/YYYY"
                  )}
                </div>

                <div className="date-time-section__departure-display">
                  Departure: {selectedTime}
                </div>

                <div className="date-time-section__icon">
                  <CalendarIcon />
                </div>
              </div>
            </div>

            <div className="date-time-section__footer">
              <div className="date-time-section__contact-block">
                <p className="date-time-section__contact-note">
                  To book dates outside of SGRS&apos;s departure schedule, please contact the Sales team for assistance.
                </p>

                <div className="date-time-section__contact-pills">
                  <a href="tel:+84983912325" className="date-time-section__contact-pill">Hotline</a>
                  <a href="https://wa.me/84983912325" target="_blank" rel="noopener noreferrer" className="date-time-section__contact-pill">Whatsapp</a>
                  <a href="https://zalo.me/84983912325" target="_blank" rel="noopener noreferrer" className="date-time-section__contact-pill">Zalo</a>
                  <a href="mailto:sales@saigonriverstar.com" className="date-time-section__contact-pill">Email</a>
                </div>
              </div>

              <div className="date-time-section__actions">
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
          </div>
        </div>
      )}

      {/* Step 2: Guest Amount - Day Tour */}
      {currentStep === 2 && tourType === 'day-tour' && (
        <div className="booking-form__section">
          <div className="guest-amount-section guest-amount-section--day-tour">
            <div style={{ marginBottom: '16px' }}>
              <label className="guest-amount-section__label" style={{ marginBottom: 0 }}>Party Size</label>
            </div>
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
            <button 
              type="button" 
              className="btn-primary" 
              onClick={handleNextStep}
              disabled={isSlotExceeded}
              style={isSlotExceeded ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Guest Amount - Overnight Tour */}
      {currentStep === 2 && tourType === 'overnight-tour' && (
        <div className="booking-form__section">
          <div className="guest-amount-section guest-amount-section--overnight-tour">
            <div style={{ marginBottom: '16px' }}>
              <label className="guest-amount-section__label" style={{ marginBottom: 0 }}>Guest Amount</label>
            </div>
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
            <button 
              type="button" 
              className="btn-primary" 
              onClick={handleNextStep}
              disabled={isSlotExceeded}
              style={isSlotExceeded ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Guest Info - Same as before */}
      {currentStep === 3 && (
        <div className="booking-form__section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <p className="booking-form__notice" style={{ margin: 0 }}>
                (*) The details you provide for all guests must match their government-issued photo IDs.
              </p>
              <p className="booking-form__notice" style={{ margin: 0 }}>
                Personal information is required for Port Authority submission.
              </p>
            </div>
            <button
              type="button"
              className="btn-secondary"
              style={{ padding: '8px 16px', fontSize: '12px', whiteSpace: 'nowrap' }}
              onClick={handleAutofill}
            >
              Autofill Test Data
            </button>
          </div>


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

          {/* Hotel Pick-up (optional, one per booking) */}
          <div className="pickup-section">
            <div className="pickup-section__header">
              <label className="pickup-section__label" htmlFor="hotel-pickup">
                Hotel Pick-up Address (optional)
              </label>
              <p className="pickup-section__note">
                *Complimentary pick-up is available within a 3km radius of Bach Dang Wharf.
                <br />
                Surcharges apply for longer distances (our Sales Team will contact you for details).
              </p>
            </div>
            <input
              id="hotel-pickup"
              type="text"
              className="pickup-section__input"
              value={hotelPickup}
              onChange={(e) => setHotelPickup(e.target.value)}
            />
          </div>
        </div>
      )}

      {/* Step 4: Payment Selection */}
      {currentStep === 4 && (
        <div className="booking-form__section">
          <div className="payment-method-section">
            <label className="payment-method-section__label">Payment</label>
            <div className="payment-method-section__options">
              {paymentMethod === 'qr_bank' ? (
                <div className="payment-bank-panel">
                  <div className="payment-bank-panel__content">
                    <div className="payment-bank-panel__details">
                      <h3 className="payment-bank-panel__title">Internet Banking (for local transcation)</h3>

                      <div className="payment-bank-panel__meta">
                        <div className="payment-bank-panel__meta-block">
                          <span className="label">Order Value:</span>
                          <div className="value-row">
                            <span className="value">{formatPrice(currentTotalPrice)} VND</span>
                            <button type="button" className="copy-btn" onClick={handleCopyQrAmount}>
                              {hasCopiedQrAmount ? 'COPIED' : 'COPY'}
                            </button>
                          </div>
                        </div>

                        <div className="payment-bank-panel__meta-block">
                          <span className="label">Transaction Fee:</span>
                          <span className="value">0 VND</span>
                        </div>

                        <div className="payment-bank-panel__meta-block">
                          <span className="label">Merchant:</span>
                          <span className="value merchant">{qrBankDetails.merchantName}</span>
                        </div>
                      </div>

                      <div className="payment-bank-panel__actions">
                        <button type="submit" className="btn-primary payment-bank-panel__confirm">
                          Submit
                        </button>
                        <button type="button" className="btn-secondary payment-bank-panel__download" onClick={handleDownloadQr}>
                          Download QR Code
                        </button>
                      </div>
                    </div>

                    <div className="payment-bank-panel__qr">
                      <p className="payment-bank-panel__qr-title">
                        Scan the QR Code Using Your Banking App or E-Wallet
                      </p>
                      <div className="payment-bank-panel__qr-card">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={qrPreviewUrl} alt="Local bank transfer QR code" />
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  className="payment-method-card"
                  onClick={() => setPaymentMethod('qr_bank')}
                >
                  <div className="payment-method-card__info">
                    <div className="payment-method-card__name">Local Bank Transfer</div>
                  </div>
                </button>
              )}

              <button
                type="button"
                className={`payment-method-card ${paymentMethod === 'onepay' ? 'payment-method-card--selected' : ''} ${isSubmitting ? 'payment-method-card--loading' : ''}`}
                onClick={handleOnePaySelection}
                disabled={isSubmitting}
              >
                <div className="payment-method-card__info">
                  <div className="payment-method-card__name">
                    International Card Payment
                    {isSubmitting && paymentMethod === 'onepay' && (
                      <span className="spinner spinner--small" style={{ marginLeft: '10px' }} />
                    )}
                  </div>
                  <div className="payment-method-card__desc">(Visa/Mastercard/JCB/UnionPay/Amex)</div>
                </div>
              </button>
            </div>
          </div>
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
        availabilityMap={openDatesMap}
        tourId={tourId}
        selectedTime={selectedTime}
        startTimes={selectedDate && openDatesMap[selectedDate]?.times?.length > 0 
          ? openDatesMap[selectedDate].times 
          : (startTimes && startTimes.length > 0 ? startTimes : ['08:00'])}
        onSelectTime={setSelectedTime}
      />
    </form>
  );
}
