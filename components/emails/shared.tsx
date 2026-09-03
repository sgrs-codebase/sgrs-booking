import * as React from 'react';
import { Column, Heading, Img, Link, Row, Section, Text } from '@react-email/components';

// Shared building blocks for the transactional emails (BookingReceipt / AwaitingConfirmation).

export interface GuestDetail {
  firstName: string;
  lastName: string;
  gender: string;
  dateOfBirth?: string;
  citizenship?: string;
  residence?: string;
  phone?: string;
  email?: string;
  idNumber?: string;
  issueDate?: string;
  expiryDate?: string;
  issuingAuthority?: string;
  note?: string;
}

export const COLOR_PRIMARY = '#56231E';
export const COLOR_WHITE = '#FFFFFF';
export const FONT_PRIMARY = "'Mona Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
export const FONT_SECONDARY = "Georgia, 'Times New Roman', serif";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://saigonriverstar.com';
export const LOGO_URL = `${BASE_URL}/images/logo-email.png`;

// Value stored in Airtable when the guest leaves the pick-up address empty
export const NO_TRANSFER = 'NO TRANSFER SERVICE';

// Rendered one line per entry in the emails
export const CHECK_IN_LINES = [
  'Bach Dang Wharf,',
  '2 Ton Duc Thang Street,',
  'Saigon Ward, Ho Chi Minh City',
];

// Inline <style> shared by both emails
export const EMAIL_BASE_CSS = `
  ul { list-style-type: disc; padding-left: 20px; margin: 0; }
  li { margin-bottom: 10px; font-family: ${FONT_PRIMARY}; font-size: 12px; line-height: 1.4; color: ${COLOR_PRIMARY}; }
  li ul { margin-top: 8px; padding-left: 20px; list-style-type: circle; }
  li ul li { margin-bottom: 6px; }
  p { font-family: ${FONT_PRIMARY}; font-size: 12px; line-height: 1.4; color: ${COLOR_PRIMARY}; margin: 0 0 10px 0; }
`;

// ── Formatting helpers ──

// Thousands separated by commas, per the approved email design
export const formatPrice = (price: string | number) => {
  return Number(price).toLocaleString('en-US');
};

// "2025-12-02" -> "02 December 2025"
export const formatLongDate = (date?: string) => {
  if (!date) return '';
  const parsed = new Date(`${String(date).split('T')[0]}T00:00:00`);
  if (isNaN(parsed.getTime())) return date;
  return parsed.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
};

const parseTimeToMinutes = (time?: string): number | null => {
  const match = String(time || '').match(/^(\d{1,2}):(\d{2})/);
  if (!match) return null;
  return parseInt(match[1], 10) * 60 + parseInt(match[2], 10);
};

// "08:00" -> "08:00 AM"
export const formatTime12h = (time?: string) => {
  const minutes = parseTimeToMinutes(time);
  if (minutes === null) return time || '';
  const hours24 = Math.floor(minutes / 60);
  const mins = minutes % 60;
  const suffix = hours24 >= 12 ? 'PM' : 'AM';
  const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
  return `${String(hours12).padStart(2, '0')}:${String(mins).padStart(2, '0')} ${suffix}`;
};

// Guests gather 15 minutes before the boat leaves
export const getMeetingTime = (departureTime?: string) => {
  const minutes = parseTimeToMinutes(departureTime);
  if (minutes === null) return '';
  const meeting = (minutes - 15 + 24 * 60) % (24 * 60);
  return formatTime12h(`${String(Math.floor(meeting / 60)).padStart(2, '0')}:${String(meeting % 60).padStart(2, '0')}`);
};

const parseGuestCounts = (guestsStr: string): { adults: number; children: number; infants: number } => {
  const match = guestsStr.match(/(\d+)\s*Adults?,\s*(\d+)\s*Children,\s*(\d+)\s*Infants?/);
  if (match) {
    return {
      adults: parseInt(match[1], 10),
      children: parseInt(match[2], 10),
      infants: parseInt(match[3], 10),
    };
  }
  return { adults: 0, children: 0, infants: 0 };
};

const getGuestType = (index: number, counts: { adults: number; children: number; infants: number }): string => {
  if (index < counts.adults) return 'Adult';
  if (index < counts.adults + counts.children) return 'Child';
  return 'Infant';
};

const formatGuestName = (firstName: string, lastName: string, gender: string): string => {
  const title = gender.toLowerCase() === 'male' ? 'MR' : 'MS';
  return `${lastName.toUpperCase()}/${firstName.toUpperCase()} ${title}`;
};

const getGuestPrice = (type: string, adultPrice: number, childPrice: number, infantPrice: number): number => {
  if (type === 'Adult') return adultPrice;
  if (type === 'Child') return childPrice;
  return infantPrice;
};

// ── Shared sections ──

export const EmailLogo = () => (
  <Section style={styles.logoSection}>
    <Img src={LOGO_URL} alt="Saigon River Star" width="180" style={styles.logo} />
  </Section>
);

/** Bordered badge above the email title (a check mark, an hourglass, ...) */
export const StatusBadge = ({ glyph }: { glyph: string }) => (
  <table role="presentation" cellPadding={0} cellSpacing={0} style={styles.badgeTable}>
    <tbody>
      <tr>
        <td style={styles.badgeCell}>{glyph}</td>
      </tr>
    </tbody>
  </table>
);

export const DetailRow = ({ label, note, children }: { label: string; note?: string; children: React.ReactNode }) => (
  <Row style={styles.detailRow}>
    <Column style={styles.detailLabel}><strong>{label}</strong></Column>
    <Column style={styles.detailValue}>
      {children}
      {note && <Text style={styles.detailValueNote}>{note}</Text>}
    </Column>
  </Row>
);

export const GuestTable = ({
  guestDetails,
  guestCountsStr,
  adultPrice,
  childPrice,
  infantPrice,
}: {
  guestDetails: GuestDetail[];
  guestCountsStr: string;
  adultPrice: number;
  childPrice: number;
  infantPrice: number;
}) => {
  const guestCounts = parseGuestCounts(guestCountsStr);

  return (
    <Section style={{ padding: '10px 0 0' }}>
      <Row style={styles.guestHeader}>
        <Column style={{ ...styles.guestHeaderCell, width: '45%' }}>Guest</Column>
        <Column style={{ ...styles.guestHeaderCell, width: '25%' }}>Fare</Column>
        <Column style={{ ...styles.guestHeaderCell, width: '30%' }}>Special Requests</Column>
      </Row>
      {guestDetails.map((guest, index) => {
        const guestType = getGuestType(index, guestCounts);
        const guestPrice = getGuestPrice(guestType, adultPrice, childPrice, infantPrice);
        // The booking form stores "None" when the guest left the note empty
        const specialRequest = guest.note && guest.note.trim() && guest.note.trim().toLowerCase() !== 'none'
          ? guest.note
          : '';
        return (
          <Row key={index} style={styles.guestRow}>
            <Column style={{ width: '45%', verticalAlign: 'top' as const }}>
              <Text style={styles.guestName}>
                {formatGuestName(guest.firstName, guest.lastName, guest.gender)}
              </Text>
              <Text style={styles.guestType}>{guestType}</Text>
            </Column>
            <Column style={{ width: '25%', verticalAlign: 'top' as const }}>
              <Text style={styles.guestFee}>{formatPrice(guestPrice)} VND</Text>
            </Column>
            <Column style={{ width: '30%', verticalAlign: 'top' as const }}>
              <Text style={styles.guestNote}>{specialRequest}</Text>
            </Column>
          </Row>
        );
      })}
    </Section>
  );
};

export const TotalSection = ({ amount }: { amount: string }) => (
  <Section style={styles.totalSection}>
    <Row>
      <Column>
        <Text style={styles.totalLabel}>Total</Text>
      </Column>
      <Column style={{ textAlign: 'right' as const }}>
        <Text style={styles.totalAmount}>{formatPrice(amount)} VND</Text>
      </Column>
    </Row>
  </Section>
);

export const PolicySection = ({ title, items }: { title: string; items: React.ReactNode[] }) => (
  <Section style={styles.contentSection}>
    <Heading as="h3" style={styles.sectionHeading}>{title}</Heading>
    <ul>
      {items.map((item, index) => (
        <li key={index}>{item}</li>
      ))}
    </ul>
  </Section>
);

/** Two-column contact block: general channels on the left, direct lines on the right */
export const ContactColumns = () => (
  <Row>
    <Column style={{ width: '55%', verticalAlign: 'top' as const }}>
      <Text style={styles.footerText}>Email: info@saigonriverstar.com</Text>
      <Text style={styles.footerText}>Hotline: +84 97 816 09 59</Text>
      <Text style={styles.footerText}>Website: saigonriverstar.com</Text>
    </Column>
    <Column style={{ width: '45%', verticalAlign: 'top' as const }}>
      <Text style={styles.footerText}>Sales 1: (+84) 98 391 2325</Text>
      <Text style={styles.footerText}>Sales 2: (+84) 97 816 0959</Text>
      <Text style={styles.footerText}>Operation: (+84) 96 999 5846</Text>
    </Column>
  </Row>
);

export const SocialFooter = () => (
  <>
    <Section style={styles.socialFooter}>
      <Row>
        <Column style={styles.socialLink}>
          <Link href="https://saigonriverstar.com" style={styles.socialLinkText}>Website</Link>
        </Column>
        <Column style={styles.socialLink}>
          <Link href="https://www.facebook.com/profile.php?id=61577170094434" style={styles.socialLinkText}>Facebook</Link>
        </Column>
        <Column style={styles.socialLink}>
          <Link href="https://www.instagram.com/saigon_riverstar/" style={styles.socialLinkText}>Instagram</Link>
        </Column>
        <Column style={styles.socialLink}>
          <Link href="tel:+84983912325" style={styles.socialLinkText}>Hotline</Link>
        </Column>
      </Row>
    </Section>

    <Section style={styles.copyrightSection}>
      <Text style={styles.copyrightText}>
        &copy; {new Date().getFullYear()}, SAI GON RIVER STAR
      </Text>
    </Section>
  </>
);

// ── Shared styles ──

export const styles = {
  body: {
    backgroundColor: COLOR_WHITE,
    fontFamily: FONT_PRIMARY,
  },
  container: {
    backgroundColor: COLOR_WHITE,
    margin: '0 auto',
    maxWidth: '800px',
    padding: '0 40px 40px',
  },
  logoSection: {
    textAlign: 'center' as const,
    padding: '40px 10px 0',
  },
  logo: {
    margin: '0 auto',
  },
  header: {
    textAlign: 'center' as const,
    padding: '40px 10px 30px',
  },
  badgeTable: {
    margin: '0 auto 20px',
    borderCollapse: 'collapse' as const,
  },
  badgeCell: {
    width: '44px',
    height: '44px',
    border: `2px solid ${COLOR_PRIMARY}`,
    borderRadius: '6px',
    textAlign: 'center' as const,
    verticalAlign: 'middle' as const,
    fontFamily: FONT_PRIMARY,
    fontSize: '22px',
    lineHeight: '1',
    color: COLOR_PRIMARY,
  },
  title: {
    fontFamily: FONT_SECONDARY,
    fontWeight: 700 as const,
    fontSize: '40px',
    color: COLOR_PRIMARY,
    lineHeight: '1.1',
    margin: '10px 0 0',
  },
  message: {
    fontFamily: FONT_PRIMARY,
    fontWeight: 500 as const,
    fontSize: '15px',
    color: COLOR_PRIMARY,
    textAlign: 'center' as const,
    lineHeight: '1.3',
    margin: '20px 0 0',
  },
  divider: {
    borderColor: 'rgba(86, 35, 30, 0.2)',
    borderWidth: '1px 0 0 0',
    margin: '0',
  },
  section: {
    padding: '15px 0 20px',
  },
  tourName: {
    fontFamily: FONT_PRIMARY,
    fontWeight: 500 as const,
    fontSize: '20px',
    color: COLOR_PRIMARY,
    lineHeight: '1.1',
    margin: '0 0 10px',
  },
  tourSubtitle: {
    fontFamily: FONT_PRIMARY,
    fontWeight: 500 as const,
    fontSize: '16px',
    color: COLOR_PRIMARY,
    lineHeight: '1.1',
    margin: '0',
  },
  detailRow: {
    marginBottom: '8px',
  },
  detailLabel: {
    fontFamily: FONT_PRIMARY,
    fontWeight: 700 as const,
    fontSize: '16px',
    color: COLOR_PRIMARY,
    width: '190px',
    paddingBottom: '8px',
    verticalAlign: 'top' as const,
  },
  detailValueNote: {
    fontFamily: FONT_PRIMARY,
    fontWeight: 400 as const,
    fontStyle: 'italic' as const,
    fontSize: '10px',
    color: 'rgba(86, 35, 30, 0.7)',
    lineHeight: '1.3',
    margin: '2px 0 0',
  },
  detailValue: {
    fontFamily: FONT_PRIMARY,
    fontWeight: 500 as const,
    fontSize: '16px',
    color: COLOR_PRIMARY,
    paddingBottom: '8px',
    verticalAlign: 'top' as const,
  },
  guestHeader: {
    backgroundColor: COLOR_PRIMARY,
    padding: '10px',
  },
  guestHeaderCell: {
    fontFamily: FONT_PRIMARY,
    fontWeight: 500 as const,
    fontSize: '12px',
    color: COLOR_WHITE,
    lineHeight: '1.1',
    padding: '10px',
  },
  guestRow: {
    borderBottom: '1px solid rgba(0,0,0,0.1)',
    padding: '20px 10px',
  },
  guestName: {
    fontFamily: FONT_PRIMARY,
    fontWeight: 500 as const,
    fontSize: '16px',
    color: COLOR_PRIMARY,
    lineHeight: '1.1',
    margin: '0 0 4px',
  },
  guestType: {
    fontFamily: FONT_PRIMARY,
    fontWeight: 500 as const,
    fontSize: '12px',
    color: COLOR_PRIMARY,
    lineHeight: '1.1',
    margin: '0',
  },
  guestFee: {
    fontFamily: FONT_PRIMARY,
    fontWeight: 500 as const,
    fontSize: '12px',
    color: COLOR_PRIMARY,
    lineHeight: '1.1',
    margin: '0',
  },
  guestNote: {
    fontFamily: FONT_PRIMARY,
    fontWeight: 500 as const,
    fontSize: '12px',
    color: COLOR_PRIMARY,
    lineHeight: '1.3',
    margin: '0',
  },
  totalSection: {
    borderTop: '1px solid #000000',
    padding: '30px 10px',
  },
  totalLabel: {
    fontFamily: FONT_SECONDARY,
    fontWeight: 400 as const,
    fontSize: '26px',
    color: COLOR_PRIMARY,
    margin: '0',
  },
  totalAmount: {
    fontFamily: FONT_SECONDARY,
    fontWeight: 400 as const,
    fontSize: '26px',
    color: COLOR_PRIMARY,
    margin: '0',
    textAlign: 'right' as const,
  },
  contentSection: {
    borderTop: '1px solid #000000',
    padding: '30px 10px',
  },
  sectionHeading: {
    fontFamily: FONT_PRIMARY,
    fontWeight: 700 as const,
    fontSize: '18px',
    letterSpacing: '0.02em',
    textTransform: 'uppercase' as const,
    color: COLOR_PRIMARY,
    lineHeight: '1.1',
    margin: '0 0 16px',
  },
  inlineLink: {
    textDecoration: 'underline',
    color: COLOR_PRIMARY,
  },
  footerText: {
    fontFamily: FONT_PRIMARY,
    fontWeight: 500 as const,
    fontSize: '12px',
    color: COLOR_PRIMARY,
    lineHeight: '1.4',
    margin: '0 0 4px',
  },
  socialFooter: {
    backgroundColor: COLOR_PRIMARY,
    borderRadius: '50px',
    padding: '15px 25px',
    marginTop: '30px',
    marginBottom: '20px',
  },
  socialLink: {
    textAlign: 'center' as const,
    verticalAlign: 'middle' as const,
  },
  socialLinkText: {
    fontFamily: FONT_PRIMARY,
    fontWeight: 500 as const,
    fontSize: '12px',
    color: '#F3F0E8',
    lineHeight: '1.1',
    textDecoration: 'none',
    margin: '0',
  },
  copyrightSection: {
    textAlign: 'center' as const,
    padding: '10px 0 0',
  },
  copyrightText: {
    fontFamily: FONT_PRIMARY,
    fontWeight: 500 as const,
    fontSize: '10px',
    color: 'rgba(86, 35, 30, 0.7)',
    margin: '0',
  },
};
