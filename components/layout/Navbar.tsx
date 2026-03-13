'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

const logoSrc = '/images/logo.svg';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="navbar">
      <Link href="/" className="navbar__logo">
        <Image
          src={logoSrc}
          alt="Saigon River Star"
          width={110}
          height={40}
          priority
        />
      </Link>

      <button
        className={`navbar__toggle ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle menu"
      >
        <span></span>
        <span></span>
        <span></span>
      </button>

      <div className={`navbar__nav ${isOpen ? 'active' : ''}`}>
        <Link href="https://www.saigonriverstar.com/about-us" className="navbar__link">
          About Us
        </Link>
        <Link href="https://www.saigonriverstar.com/insights" className="navbar__link">
          Insights
        </Link>
        <Link href="https://www.saigonriverstar.com/journeys" className="navbar__link navbar__link--dropdown">
          Tours
          <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
        <Link href="https://www.saigonriverstar.com/contact" className="navbar__link">
          Contact
        </Link>
        <Link href="https://www.saigonriverstar.com/contact" className="navbar__cta">
          Book Your Tours
        </Link>
      </div>
    </nav>
  );
}
