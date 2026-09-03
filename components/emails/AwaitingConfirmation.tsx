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
} from '@react-email/components';
import {
  ContactColumns,
  DetailRow,
  EMAIL_BASE_CSS,
  EmailLogo,
  GuestTable,
  SocialFooter,
  StatusBadge,
  TotalSection,
  formatLongDate,
  formatTime12h,
  styles,
  type GuestDetail,
} from './shared';

interface AwaitingConfirmationProps {
  orderId: string;
  customerName?: string;
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
}

const PROCESSING_TIME = 'Usually 3-5 business days, depending on your bank.';

export const AwaitingConfirmation = ({
  orderId,
  customerName,
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
}: AwaitingConfirmationProps) => {
  const previewText = `Booking Received - ${orderId}`;

  return (
    <Html>
      <Head>
        <style>{EMAIL_BASE_CSS}</style>
      </Head>
      <Preview>{previewText}</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>

          {/* ── Header ── */}
          <EmailLogo />

          <Section style={styles.header}>
            <StatusBadge glyph="&#8987;" />

            <Heading style={styles.title}>Booking Received</Heading>
            <Text style={styles.message}>
              Your booking request has been successfully received and is currently being processed.
            </Text>
            <Text style={styles.message}>
              Dear {customerName || 'Guest'},
            </Text>
            <Text style={styles.message}>
              Thank you for your booking with Sai Gon River Star. This email is to confirm that your
              booking request has been successfully received and is currently being processed.
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
            <DetailRow label="Booking ID:">{orderId}</DetailRow>
            <DetailRow label="Departure date:">
              {formatLongDate(travelDate)}{returnDate ? ` - ${formatLongDate(returnDate)}` : ''}
            </DetailRow>
            <DetailRow label="Departure time:">{formatTime12h(departureTime) || '-'}</DetailRow>
            <DetailRow label="Estimated Processing Time:">{PROCESSING_TIME}</DetailRow>

            <Text style={awaitingStyles.processingNote}>
              Once the payment status has been done, a confirmation email with the final details
              will be sent to you.
            </Text>
          </Section>

          {/* ── Guest Table ── */}
          <GuestTable
            guestDetails={guestDetails}
            guestCountsStr={guestCountsStr}
            adultPrice={adultPrice}
            childPrice={childPrice}
            infantPrice={infantPrice}
          />

          {/* ── Total ── */}
          <TotalSection amount={amount} />

          {/* ── Footer Note ── */}
          <Section style={styles.contentSection}>
            <Text style={styles.footerText}>
              If you have any questions or need to update your booking, please contact us:
            </Text>
            <br />
            <ContactColumns />
            <br />
            <Text style={styles.footerText}>
              Thank you for choosing Sai Gon River Star. We appreciate your patience and look
              forward to welcoming you on board.
            </Text>
            <br />
            <Text style={styles.footerText}>Warm regards,</Text>
            <Text style={styles.footerText}><strong>Sai Gon River Star</strong></Text>
          </Section>

          <SocialFooter />

        </Container>
      </Body>
    </Html>
  );
};

const awaitingStyles = {
  processingNote: {
    fontFamily: styles.body.fontFamily,
    fontWeight: 700 as const,
    fontStyle: 'italic' as const,
    fontSize: '14px',
    color: styles.title.color,
    lineHeight: '1.3',
    margin: '12px 0 0',
  },
};

export default AwaitingConfirmation;
