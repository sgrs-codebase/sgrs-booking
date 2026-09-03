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
  CHECK_IN_LINES,
  ContactColumns,
  DetailRow,
  EMAIL_BASE_CSS,
  EmailLogo,
  GuestTable,
  NO_TRANSFER,
  PolicySection,
  SocialFooter,
  StatusBadge,
  TotalSection,
  formatLongDate,
  formatTime12h,
  getMeetingTime,
  styles,
  type GuestDetail,
} from './shared';

export type { GuestDetail };

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

  const pickupValue = (hotelPickup || '').trim();
  const hasPickup = Boolean(pickupValue) && pickupValue.toUpperCase() !== NO_TRANSFER;

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
            <StatusBadge glyph="&#10003;" />

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
            <DetailRow label="Booking ID:">{orderId}</DetailRow>
            <DetailRow label="Meeting time:">{getMeetingTime(departureTime) || '-'}</DetailRow>
            <DetailRow label="Departure date:">
              {formatLongDate(travelDate)}{returnDate ? ` - ${formatLongDate(returnDate)}` : ''}
            </DetailRow>
            <DetailRow label="Departure time:">{formatTime12h(departureTime) || '-'}</DetailRow>
            <DetailRow
              label="Pick-up address:"
              note={hasPickup
                ? '(Saigon River Star will contact you for exact pick-up time 1 day prior to departure via provided phone number or email)'
                : undefined}
            >
              {hasPickup ? pickupValue : NO_TRANSFER}
            </DetailRow>
            <DetailRow label="Check-in:">
              {CHECK_IN_LINES.map((line, index) => (
                <React.Fragment key={index}>
                  {line}
                  {index < CHECK_IN_LINES.length - 1 && <br />}
                </React.Fragment>
              ))}
            </DetailRow>
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
            <ContactColumns />
          </Section>

          <SocialFooter />

        </Container>
      </Body>
    </Html>
  );
};

export default BookingReceipt;
