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
          width={140}
          height={50}
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
        <Link href="https://www.saigonriverstar.com/journeys" className="navbar__link">
          Tours
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
