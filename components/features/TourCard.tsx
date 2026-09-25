'use client';

import { useState } from 'react';
import Image from 'next/image';

// Accordion plus icon - the vertical stroke collapses when open, leaving a minus
const PlusIcon = ({ isOpen }: { isOpen: boolean }) => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M1 9H17" stroke="#56231E" strokeWidth="1.2" strokeLinecap="round"/>
    <path
      className="accordion-item__icon-vertical"
      d="M9 1V17"
      stroke="#56231E"
      strokeWidth="1.2"
      strokeLinecap="round"
      style={{ transform: isOpen ? 'scaleY(0)' : 'scaleY(1)' }}
    />
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
        <span className="accordion-item__icon">
          <PlusIcon isOpen={isOpen} />
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
    tag?: string;
    includes: string[];
    excludes?: string[];
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
            {tour.tag && <span className="tour-card__tag">{tour.tag}</span>}
            <h2 className="tour-card__title">{tour.name}</h2>
            <p className="tour-card__subtitle">{tour.subtitle}</p>
          </div>
          
          <div className="tour-card__meta">
            <span className="tour-card__meta-item">{tour.type}</span>
            <span className="tour-card__meta-item">Duration: {tour.duration}</span>
          </div>
          
          <div className="tour-card__accordion">
            <AccordionItem title="Included">
              <ul>
                {tour.includes.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </AccordionItem>

            {tour.excludes && tour.excludes.length > 0 && (
              <AccordionItem title="Excluded">
                <ul>
                  {tour.excludes.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </AccordionItem>
            )}
            
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
