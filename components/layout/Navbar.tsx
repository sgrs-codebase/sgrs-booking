'use client';

import Image from 'next/image';
import Link from 'next/link';

const logoSrc = '/images/logo.svg';

export default function Navbar() {
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
      
      <div className="navbar__nav">
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
