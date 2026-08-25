import * as React from 'react';
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Preview,
  Section,
  Text,
  Hr,
  Row,
  Column,
  Link,
} from '@react-email/components';

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

interface BookingReceiptProps {
  orderId: string;
  tourName: string;
  tourSubtitle: string;
  travelDate: string;
  returnDate?: string;
  departureTime?: string;
  hotelPickup?: string;
  guestDetails: GuestDetail[];
  guestCountsStr: string; // e.g. "2 Adults, 1 Children, 0 Infants"
  amount: string;
  adultPrice: number;
  childPrice: number;
  infantPrice: number;
}

const COLOR_PRIMARY = '#56231E';
const COLOR_WHITE = '#FFFFFF';
const FONT_PRIMARY = "'Mona Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
const FONT_SECONDARY = "Georgia, 'Times New Roman', serif";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://saigonriverstar.com';
const LOGO_URL = `${BASE_URL}/images/logo-email.png`;

// Value stored in Airtable when the guest leaves the pick-up address empty
const NO_TRANSFER = 'NO TRANSFER SERVICE';

const CHECK_IN_ADDRESS = 'Bach Dang Wharf, 2 Ton Duc Thang Street, Saigon Ward, Ho Chi Minh City';

const formatPrice = (price: string | number) => {
  return Number(price).toLocaleString('vi-VN').replace(/,/g, '.');
};

// "2025-12-02" -> "02 December 2025"
const formatLongDate = (date?: string) => {
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
const formatTime12h = (time?: string) => {
  const minutes = parseTimeToMinutes(time);
  if (minutes === null) return time || '';
  const hours24 = Math.floor(minutes / 60);
  const mins = minutes % 60;
  const suffix = hours24 >= 12 ? 'PM' : 'AM';
  const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
  return `${String(hours12).padStart(2, '0')}:${String(mins).padStart(2, '0')} ${suffix}`;
};

// Guests gather 15 minutes before the boat leaves
const getMeetingTime = (departureTime?: string) => {
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

const PolicySection = ({ title, items }: { title: string; items: React.ReactNode[] }) => (
  <Section style={styles.contentSection}>
    <Heading as="h3" style={styles.sectionHeading}>{title}</Heading>
    <ul>
      {items.map((item, index) => (
        <li key={index}>{item}</li>
      ))}
    </ul>
  </Section>
);

export const BookingReceipt = ({
  orderId,
  tourName,
  tourSubtitle,
  travelDate,
  returnDate,
  departureTime,
  hotelPickup,
  guestDetails,
  guestCountsStr,
  amount,
  adultPrice,
  childPrice,
  infantPrice,
}: BookingReceiptProps) => {
  const previewText = `Your Booking Is Confirmed - ${orderId}`;
  const guestCounts = parseGuestCounts(guestCountsStr);

  const pickupValue = (hotelPickup || '').trim();
  const hasPickup = Boolean(pickupValue) && pickupValue.toUpperCase() !== NO_TRANSFER;

  return (
    <Html>
      <Head>
        <style>{`
          ul { list-style-type: disc; padding-left: 20px; margin: 0; }
          li { margin-bottom: 10px; font-family: ${FONT_PRIMARY}; font-size: 12px; line-height: 1.4; color: ${COLOR_PRIMARY}; }
          li ul { margin-top: 8px; padding-left: 20px; list-style-type: circle; }
          li ul li { margin-bottom: 6px; }
          p { font-family: ${FONT_PRIMARY}; font-size: 12px; line-height: 1.4; color: ${COLOR_PRIMARY}; margin: 0 0 10px 0; }
        `}</style>
      </Head>
      <Preview>{previewText}</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>

          {/* ── Header ── */}
          <Section style={styles.logoSection}>
            <Img src={LOGO_URL} alt="Saigon River Star" width="180" style={styles.logo} />
          </Section>

          <Section style={styles.header}>
            <table role="presentation" cellPadding={0} cellSpacing={0} style={styles.checkTable}>
              <tbody>
                <tr>
                  <td style={styles.checkCell}>&#10003;</td>
                </tr>
              </tbody>
            </table>

            <Heading style={styles.title}>Your Booking Is Confirmed!</Heading>
            <Text style={styles.message}>
              We are delighted to confirm your upcoming journey with us.
            </Text>
            <Text style={styles.message}>
              Please kindly review the details below carefully to ensure all information is correct
              and everything is perfectly arranged for a smooth and memorable experience.
            </Text>
          </Section>

          <Hr style={styles.divider} />

          {/* ── Tour Info ── */}
          <Section style={styles.section}>
            <Text style={styles.tourName}>{tourName}</Text>
            <Text style={styles.tourSubtitle}>{tourSubtitle}</Text>
          </Section>

          <Hr style={styles.divider} />

          {/* ── Details ── */}
          <Section style={styles.section}>
            <Row style={styles.detailRow}>
              <Column style={styles.detailLabel}><strong>Booking ID:</strong></Column>
              <Column style={styles.detailValue}>{orderId}</Column>
            </Row>
            <Row style={styles.detailRow}>
              <Column style={styles.detailLabel}><strong>Departure date:</strong></Column>
              <Column style={styles.detailValue}>
                {formatLongDate(travelDate)}{returnDate ? ` - ${formatLongDate(returnDate)}` : ''}
              </Column>
            </Row>
            <Row style={styles.detailRow}>
              <Column style={styles.detailLabel}><strong>Departure time:</strong></Column>
              <Column style={styles.detailValue}>{formatTime12h(departureTime) || '-'}</Column>
            </Row>
            <Row style={styles.detailRow}>
              <Column style={styles.detailLabel}><strong>Meeting time:</strong></Column>
              <Column style={styles.detailValue}>{getMeetingTime(departureTime) || '-'}</Column>
            </Row>
            <Row style={styles.detailRow}>
              <Column style={styles.detailLabel}>
                <strong>Pick-up address:</strong>
                {hasPickup && (
                  <Text style={styles.detailLabelNote}>
                    (Saigon River Star will contact you for exact pick-up time 1 day prior to
                    departure via provided phone number or email)
                  </Text>
                )}
              </Column>
              <Column style={styles.detailValue}>{hasPickup ? pickupValue : NO_TRANSFER}</Column>
            </Row>
            <Row style={styles.detailRow}>
              <Column style={styles.detailLabel}><strong>Check-in:</strong></Column>
              <Column style={styles.detailValue}>{CHECK_IN_ADDRESS}</Column>
            </Row>
          </Section>

          {/* ── Guest Table ── */}
          <Section style={{ padding: '10px 0 0' }}>
            {/* Table Header */}
            <Row style={styles.guestHeader}>
              <Column style={{ ...styles.guestHeaderCell, width: '45%' }}>Guest</Column>
              <Column style={{ ...styles.guestHeaderCell, width: '25%' }}>Fare</Column>
              <Column style={{ ...styles.guestHeaderCell, width: '30%' }}>Special Requests</Column>
            </Row>
            {/* Guest Rows */}
            {guestDetails.map((guest, index) => {
              const guestType = getGuestType(index, guestCounts);
              const guestPrice = getGuestPrice(guestType, adultPrice, childPrice, infantPrice);
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
                    {(guest.idNumber || guest.citizenship) && (
                      <Text style={styles.guestInfo}>
                        {guest.idNumber && `ID: ${guest.idNumber}`}
                        {guest.idNumber && guest.citizenship && ' | '}
                        {guest.citizenship && `Nationality: ${guest.citizenship}`}
                      </Text>
                    )}
                    {(guest.phone || guest.email) && (
                      <Text style={styles.guestInfo}>
                        {guest.phone && `Tel: ${guest.phone}`}
                        {guest.phone && guest.email && ' | '}
                        {guest.email && `Email: ${guest.email}`}
                      </Text>
                    )}
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

          {/* ── Total ── */}
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

          {/* ── Know Before You Go ── */}
          <PolicySection
            title="KNOW BEFORE YOU GO"
            items={[
              <>
                <strong>Please bring:</strong> Valid ID &middot; Comfortable clothing &middot; Sun protection
              </>,
              <>
                <strong>Recommended:</strong> Comfortable walking shoes &middot; Hat &middot; Sunscreen
              </>,
              <>
                <strong>Please advise us in advance:</strong> Dietary requirements &middot; Allergies &middot; Mobility assistance
              </>,
            ]}
          />

          {/* ── Important Information ── */}
          <PolicySection
            title="IMPORTANT INFORMATION"
            items={[
              'Minimum departure requirement: 10 passengers per boat.',
              'Please arrive at the designated meeting point at least 30 minutes before departure in case of self-arrangement.',
              'All guests must carry a valid passport or government-issued ID during the journey.',
              'Please inform us in advance of any dietary requirements, allergies, mobility needs or medical conditions requiring assistance.',
              <>
                Late arrivals and no-shows are subject to our{' '}
                <span style={styles.inlineLink}>Cancellation &amp; No-show Policy</span>.
              </>,
            ]}
          />

          {/* ── Weather & Operational Conditions ── */}
          <PolicySection
            title="WEATHER &amp; OPERATIONAL CONDITIONS"
            items={[
              'Your safety is our highest priority. Saigon River Star may adjust the itinerary, departure time or services when required by adverse weather, unsafe river conditions, navigation restrictions or other circumstances beyond our reasonable control.',
              'Should any significant change occur, our team will contact you as soon as possible and provide the most appropriate available solution.',
            ]}
          />

          {/* ── Children & Infant Policy ── */}
          <PolicySection
            title="CHILDREN &amp; INFANT POLICY"
            items={[
              'Child (2-11 years old and under 1.2m in height): Charged at 90% of the adult rate.',
              'Infant (under 2 years old): Free of charge without separate seat and meal.',
              'Only one infant per paying adult is entitled to the complimentary infant policy. Any additional infant(s) will be charged at the applicable child rate.',
            ]}
          />

          {/* ── Cancellation Policy ── */}
          <PolicySection
            title="CANCELLATION POLICY"
            items={[
              'More than 24 hours prior to departure day: Free cancellation.',
              'Within 24 hours prior to departure day or No-show: 100% cancellation charge.',
              'The S.I.C (Seat-In-Coach / Join-in) tour requires a minimum of 10 passengers. Should the minimum number of participants not be reached, SGRS reserves the right to cancel the departure and provide a full refund.',
            ]}
          />

          {/* ── Operational Notice ── */}
          <PolicySection
            title="OPERATIONAL NOTICE"
            items={[
              'All bookings are subject to availability and final confirmation by SGRS.',
              'All S.I.C (Seat-In-Coach / Join-in) Tours are conducted with English-speaking guides only. For multilingual guide services may be arranged separately on request, subject to availability, prior confirmation, and additional charges.',
              'SGRS reserves the right to modify or cancel the itinerary due to weather conditions, force majeure events, government regulations, safety concerns, or operational requirements beyond its reasonable control.',
            ]}
          />

          {/* ── Footer Note ── */}
          <Section style={styles.contentSection}>
            <Text style={styles.footerText}>
              If you have any questions or need further assistance, please feel free to contact us anytime. We look forward to welcoming you on board and wishing you a wonderful journey with Sai Gon River Star!
            </Text>
            <br />
            <Text style={styles.footerText}>Warm regards,</Text>
            <Text style={styles.footerText}><strong>Sai Gon River Star Team</strong></Text>
            <br />
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
          </Section>

          {/* ── Social Footer Bar ── */}
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

        </Container>
      </Body>
    </Html>
  );
};

// ── Styles ──

const styles = {
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
  checkTable: {
    margin: '0 auto 20px',
    borderCollapse: 'collapse' as const,
  },
  checkCell: {
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
  detailLabelNote: {
    fontFamily: FONT_PRIMARY,
    fontWeight: 400 as const,
    fontStyle: 'italic' as const,
    fontSize: '10px',
    color: 'rgba(86, 35, 30, 0.7)',
    lineHeight: '1.3',
    margin: '2px 10px 0 0',
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
  guestInfo: {
    fontFamily: FONT_PRIMARY,
    fontWeight: 400 as const,
    fontSize: '10px',
    color: 'rgba(86, 35, 30, 0.7)',
    lineHeight: '1.4',
    margin: '4px 0 0',
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

export default BookingReceipt;
