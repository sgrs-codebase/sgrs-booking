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
import { GuestDetail } from './BookingReceipt';

interface AwaitingConfirmationProps {
  orderId: string;
  tourName: string;
  tourSubtitle: string;
  travelDate: string;
  returnDate?: string;
  departureTime?: string;
  guestCountsStr: string;
  amount: string;
}

const COLOR_PRIMARY = '#56231E';
const COLOR_WHITE = '#FFFFFF';
const FONT_PRIMARY = "'Mona Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
const FONT_SECONDARY = "Georgia, 'Times New Roman', serif";

const formatPrice = (price: string | number) => {
  return Number(price).toLocaleString('vi-VN').replace(/,/g, '.');
};

export const AwaitingConfirmation = ({
  orderId,
  tourName,
  tourSubtitle,
  travelDate,
  returnDate,
  departureTime,
  guestCountsStr,
  amount,
}: AwaitingConfirmationProps) => {
  const previewText = `Booking Awaiting Confirmation - ${orderId}`;

  return (
    <Html>
      <Head>
        <style>{`
          p { font-family: ${FONT_PRIMARY}; font-size: 14px; line-height: 1.5; color: ${COLOR_PRIMARY}; margin: 0 0 15px 0; }
        `}</style>
      </Head>
      <Preview>{previewText}</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>

          {/* ── Header ── */}
          <Section style={styles.header}>
            <Heading style={styles.title}>Booking Received</Heading>
            <Text style={styles.message}>
              We have received your booking request. Our team will check the availability and get back to you shortly.
            </Text>
          </Section>

          <Hr style={styles.divider} />

          {/* ── Status Info ── */}
          <Section style={styles.statusSection}>
            <Text style={styles.statusHeading}>Current Status: <strong>Awaiting Confirmation</strong></Text>
            <Text style={styles.statusText}>
              Please note that your booking is not yet confirmed. We will send you another email with payment instructions once we confirm the availability for your selected date.
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
              <Column style={styles.detailLabel}><strong>Guests:</strong></Column>
              <Column style={styles.detailValue}>{guestCountsStr}</Column>
            </Row>
            <Row style={styles.detailRow}>
              <Column style={styles.detailLabel}><strong>Total Amount:</strong></Column>
              <Column style={styles.detailValue}>{formatPrice(amount)} VND</Column>
            </Row>
          </Section>

          <Hr style={styles.divider} />

          {/* ── Next Steps ── */}
          <Section style={styles.contentSection}>
            <Heading as="h3" style={styles.sectionHeading}>What&apos;s Next?</Heading>
            <Text>1. Our team will review your booking request within the next few hours.</Text>
            <Text>2. Once confirmed, you will receive an email with a secure payment link.</Text>
            <Text>3. After successful payment, your booking will be officially confirmed and you&apos;ll receive your final receipt.</Text>
          </Section>


          {/* ── Footer Note ── */}
          <Section style={styles.contentSection}>
            <Text style={styles.footerText}>
              If you have any questions or need to make changes to your booking, please contact us.
            </Text>
            <br />
            <Text style={styles.footerText}>Warm regards,</Text>
            <br />
            <Text style={styles.footerText}><strong>Sai Gon River Star Team</strong></Text>
            <Text style={styles.footerText}>Email: info@saigonriverstar.com</Text>
            <Text style={styles.footerText}>Hotline: +84 97 816 09 59</Text>
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
            </Row>
          </Section>

        </Container>
      </Body>
    </Html>
  );
};

const styles = {
  body: {
    backgroundColor: COLOR_WHITE,
    fontFamily: FONT_PRIMARY,
  },
  container: {
    backgroundColor: COLOR_WHITE,
    margin: '0 auto',
    maxWidth: '600px',
    padding: '0 20px 20px',
  },
  header: {
    textAlign: 'center' as const,
    padding: '40px 10px 20px',
  },
  title: {
    fontFamily: FONT_SECONDARY,
    fontWeight: 700 as const,
    fontSize: '32px',
    color: COLOR_PRIMARY,
    lineHeight: '1.2',
    margin: '10px 0 0',
  },
  message: {
    fontFamily: FONT_PRIMARY,
    fontWeight: 500 as const,
    fontSize: '16px',
    color: COLOR_PRIMARY,
    textAlign: 'center' as const,
    lineHeight: '1.4',
    margin: '20px 0 0',
  },
  statusSection: {
    padding: '20px 10px',
    backgroundColor: '#F3F0E8',
    borderRadius: '8px',
    margin: '20px 0',
  },
  statusHeading: {
    fontSize: '18px',
    color: COLOR_PRIMARY,
    margin: '0 0 10px 0',
  },
  statusText: {
    fontSize: '14px',
    color: COLOR_PRIMARY,
    margin: '0',
  },
  divider: {
    borderColor: 'rgba(86, 35, 30, 0.2)',
    borderWidth: '1px 0 0 0',
    margin: '0',
  },
  section: {
    padding: '20px 0',
  },
  tourName: {
    fontWeight: 700 as const,
    fontSize: '18px',
    color: COLOR_PRIMARY,
    margin: '0 0 5px',
  },
  tourSubtitle: {
    fontSize: '14px',
    color: COLOR_PRIMARY,
    margin: '0',
  },
  detailRow: {
    marginBottom: '10px',
  },
  detailLabel: {
    fontWeight: 700 as const,
    fontSize: '14px',
    color: COLOR_PRIMARY,
    width: '120px',
  },
  detailValue: {
    fontSize: '14px',
    color: COLOR_PRIMARY,
  },
  contentSection: {
    padding: '20px 10px',
  },
  sectionHeading: {
    fontFamily: FONT_SECONDARY,
    fontSize: '22px',
    color: COLOR_PRIMARY,
    margin: '0 0 15px',
  },
  footerText: {
    fontSize: '12px',
    color: COLOR_PRIMARY,
    margin: '0 0 5px',
  },
  socialFooter: {
    backgroundColor: COLOR_PRIMARY,
    borderRadius: '40px',
    padding: '15px',
    marginTop: '20px',
  },
  socialLink: {
    textAlign: 'center' as const,
  },
  socialLinkText: {
    fontSize: '12px',
    color: '#F3F0E8',
    textDecoration: 'none',
  },
};

export default AwaitingConfirmation;
