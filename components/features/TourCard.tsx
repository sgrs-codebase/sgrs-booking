'use client';

import { useState } from 'react';
import Image from 'next/image';

// Icon SVG for accordion chevron
const ChevronIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4.5 6.75L9 11.25L13.5 6.75" stroke="#56231E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

interface AccordionItemProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

function AccordionItem({ title, children, defaultOpen = false }: AccordionItemProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="accordion-item">
      <button 
        className="accordion-item__header" 
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <span className="accordion-item__title">{title}</span>
        <span className="accordion-item__icon" style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
          <ChevronIcon />
        </span>
      </button>
      <div className="accordion-item__divider" />
      <div className={`accordion-item__content ${isOpen ? 'accordion-item__content--open' : ''}`}>
        <div className="accordion-item__body">
          {children}
        </div>
      </div>
    </div>
  );
}

interface TourCardProps {
  tour: {
    id: string;
    name: string;
    subtitle: string;
    type: string;
    duration: string;
    image: string;
    includes: string[];
    notes: string[];
  };
}

export default function TourCard({ tour }: TourCardProps) {
  return (
    <div className="tour-card">
      <div className="tour-card__content">
        <div className="tour-card__image">
          <Image
            src={tour.image}
            alt={tour.name}
            width={466}
            height={262}
            priority
          />
        </div>
        
        <div className="tour-card__info-container">
          <div className="tour-card__info">
            <h2 className="tour-card__title">{tour.name}</h2>
            <p className="tour-card__subtitle">{tour.subtitle}</p>
          </div>
          
          <div className="tour-card__meta">
            <span className="tour-card__meta-item">{tour.type}</span>
            <span className="tour-card__meta-item">Duration: {tour.duration}</span>
          </div>
          
          <div className="tour-card__accordion">
            <AccordionItem title="Included in your cruise">
              <ul>
                {tour.includes.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </AccordionItem>
            
            <AccordionItem title="Important Notes">
              <ul>
                {tour.notes.map((note, index) => (
                  <li key={index}>{note}</li>
                ))}
              </ul>
            </AccordionItem>
          </div>
        </div>
      </div>
      
    </div>
  );
}
