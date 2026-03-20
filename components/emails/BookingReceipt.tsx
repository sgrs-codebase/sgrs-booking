import * as React from 'react';
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
  Hr,
  Row,
  Column,
  Link,
} from '@react-email/components';

interface GuestDetail {
  firstName: string;
  lastName: string;
  gender: string;
  note?: string;
}

interface BookingReceiptProps {
  orderId: string;
  tourName: string;
  tourSubtitle: string;
  travelDate: string;
  returnDate?: string;
  departureTime?: string;
  guestDetails: GuestDetail[];
  guestCountsStr: string; // e.g. "2 Adults, 1 Children, 0 Infants"
  amount: string;
  adultPrice: number;
  childPrice: number;
  infantPrice: number;
  notices?: string;
  forceMajeure?: string;
}

const COLOR_PRIMARY = '#56231E';
const COLOR_WHITE = '#FFFFFF';
const FONT_PRIMARY = "'Mona Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
const FONT_SECONDARY = "Georgia, 'Times New Roman', serif";

const formatPrice = (price: string | number) => {
  return Number(price).toLocaleString('vi-VN').replace(/,/g, '.');
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

const defaultNotices = `<ul>
  <li><strong>All guests must carry valid passports or citizen identification cards throughout the journey.</strong></li>
  <li>Guests who fail to arrive without prior written cancellation will be considered no-shows. 100% of the service value will be charged, and no refunds will be issued.</li>
  <li>For more details, please read Sai Gon River Stars' Delivery &amp; Transportation Policy, Payment &amp; Cancellation Policy, Service Terms &amp; Conditions.</li>
  <li>Passengers are responsible for ensuring arrive at the designated check-in location on time. Late arrivals or missed departures are treated as no-shows and are subject to applicable charges.</li>
  <li>Sai Gon River Star reserves the right to refuse service in the following cases:
    <ul>
      <li>Foreign guest does not possess a valid passport or holds an expired passport.</li>
      <li>Vietnamese guest does not possess a valid passport or citizen identification card.</li>
      <li>Required guest information is incomplete, inaccurate, or submitted late.</li>
    </ul>
  </li>
  <li>Insurance coverage: Sai Gon River Star has arranged and put in force Public and Product Liability Insurance through certified insurers that cover all cruise-related activities following international standards of quality in terms of scope of cover and limit of indemnity. A summary of insurance cover is available on request.</li>
  <li>Contact Sai Gon River Star' Contact Center:
    <ul>
      <li>Hotline: (+84) 98 391 23 25</li>
      <li>Email: info@saigonriverstar.com</li>
    </ul>
  </li>
</ul>`;

const defaultForceMajeure = `<p>In the event of unforeseen circumstances beyond our reasonable control (such as natural disasters, severe weather, government restrictions, strikes, or other similar events), Sai Gon River Star may be unable to operate part or all of the tour as planned.</p>
<ul>
  <li>In such cases, the affected obligations may be suspended, and we will inform you as soon as possible.</li>
  <li>If the situation lasts for an extended period, both parties will discuss and seek a reasonable solution.</li>
  <li>Sai Gon River Star is not responsible for any failure to provide services caused by these events, but we will always make reasonable efforts to support our guests.</li>
  <li>For bad weather conditions, we reserve the right to cancel or adjust part or all of the cruise schedule to ensure safety. Any applicable surcharges (if any) will follow our company policy.</li>
</ul>
<p>Your safety and experience are always our top priorities.</p>`;

export const BookingReceipt = ({
  orderId,
  tourName,
  tourSubtitle,
  travelDate,
  returnDate,
  departureTime,
  guestDetails,
  guestCountsStr,
  amount,
  adultPrice,
  childPrice,
  infantPrice,
  notices,
  forceMajeure,
}: BookingReceiptProps) => {
  const previewText = `Booking Confirmation - ${orderId}`;
  const guestCounts = parseGuestCounts(guestCountsStr);

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
          <Section style={styles.header}>
            <Heading style={styles.title}>Payment Successful</Heading>
            <Text style={styles.message}>
              Your booking has been successfully confirmed. Here are the details of your trip.
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
              <Column style={styles.detailLabel}><strong>Departure:</strong></Column>
              <Column style={styles.detailValue}>
                {travelDate}{returnDate ? ` - ${returnDate}` : ''}, {departureTime || '07:00'}
              </Column>
            </Row>
            <Row style={styles.detailRow}>
              <Column style={styles.detailLabel}><strong>Check-in:</strong></Column>
              <Column style={styles.detailValue}>
                Bach Dang Wharf, 2 Ton Duc Thang Street, Ben Nghe Ward, District 1, Ho Chi Minh City
              </Column>
            </Row>
          </Section>

          {/* ── Guest Table ── */}
          <Section style={{ padding: '10px 0 0' }}>
            {/* Table Header */}
            <Row style={styles.guestHeader}>
              <Column style={{ ...styles.guestHeaderCell, width: '50%' }}>Name</Column>
              <Column style={{ ...styles.guestHeaderCell, width: '25%' }}>Fee</Column>
              <Column style={{ ...styles.guestHeaderCell, width: '25%', textAlign: 'right' as const }}>Note</Column>
            </Row>
            {/* Guest Rows */}
            {guestDetails.map((guest, index) => {
              const guestType = getGuestType(index, guestCounts);
              const guestPrice = getGuestPrice(guestType, adultPrice, childPrice, infantPrice);
              return (
                <Row key={index} style={styles.guestRow}>
                  <Column style={{ width: '50%', verticalAlign: 'top' as const }}>
                    <Text style={styles.guestName}>
                      {formatGuestName(guest.firstName, guest.lastName, guest.gender)}
                    </Text>
                    <Text style={styles.guestType}>{guestType}</Text>
                  </Column>
                  <Column style={{ width: '25%', verticalAlign: 'top' as const }}>
                    <Text style={styles.guestFee}>{formatPrice(guestPrice)} VND</Text>
                  </Column>
                  <Column style={{ width: '25%', verticalAlign: 'top' as const, textAlign: 'right' as const }}>
                    <Text style={styles.guestNote}>{guest.note || '-'}</Text>
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

          {/* ── Notices ── */}
          <Section style={styles.contentSection}>
            <Heading as="h3" style={styles.sectionHeading}>Notices</Heading>
            <div dangerouslySetInnerHTML={{ __html: notices || defaultNotices }} />
          </Section>

          {/* ── Force Majeure ── */}
          <Section style={styles.contentSection}>
            <Heading as="h3" style={styles.sectionHeading}>Force Majeure &amp; Weather Conditions</Heading>
            <div dangerouslySetInnerHTML={{ __html: forceMajeure || defaultForceMajeure }} />
          </Section>

          {/* ── Footer Note ── */}
          <Section style={styles.contentSection}>
            <Text style={styles.footerText}>
              If you have any questions or need further assistance, please feel free to contact us anytime. We look forward to welcoming you on board and wishing you a wonderful journey with Sai Gon River Star!
            </Text>
            <br />
            <Text style={styles.footerText}>Warm regards,</Text>
            <br />
            <Text style={styles.footerText}><strong>Sai Gon River Star Team</strong></Text>
            <Text style={styles.footerText}>Email: info@saigonriverstar.com</Text>
            <Text style={styles.footerText}>Hotline: +84 97 816 09 59</Text>
            <Text style={styles.footerText}>Website: saigonriverstar.com</Text>
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
                <Text style={styles.socialLinkText}>Hotline</Text>
              </Column>
            </Row>
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
  header: {
    textAlign: 'center' as const,
    padding: '60px 10px 30px',
  },
  title: {
    fontFamily: FONT_SECONDARY,
    fontWeight: 700 as const,
    fontSize: '48px',
    color: COLOR_PRIMARY,
    lineHeight: '1.1',
    margin: '24px 0 0',
  },
  message: {
    fontFamily: FONT_PRIMARY,
    fontWeight: 500 as const,
    fontSize: '16px',
    color: COLOR_PRIMARY,
    textAlign: 'center' as const,
    lineHeight: '1.1',
    margin: '24px 0 0',
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
    width: '120px',
    verticalAlign: 'top' as const,
  },
  detailValue: {
    fontFamily: FONT_PRIMARY,
    fontWeight: 500 as const,
    fontSize: '16px',
    color: COLOR_PRIMARY,
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
    lineHeight: '1.1',
    margin: '0',
    textAlign: 'right' as const,
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
    fontFamily: FONT_SECONDARY,
    fontWeight: 400 as const,
    fontSize: '26px',
    color: COLOR_PRIMARY,
    lineHeight: '1.1',
    margin: '0 0 20px',
  },
  footerText: {
    fontFamily: FONT_PRIMARY,
    fontWeight: 500 as const,
    fontSize: '12px',
    color: COLOR_PRIMARY,
    lineHeight: '1.1',
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
};

export default BookingReceipt;
