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

interface BookingReceiptProps {
  customerName: string;
  orderId: string;
  tourName: string;
  tourDate?: string; // We might not have this yet depending on flow, but good to have
  guests: string;
  amount: string;
  paymentRef: string;
}

export const BookingReceipt = ({
  customerName,
  orderId,
  tourName,
  tourDate,
  guests,
  amount,
  paymentRef,
}: BookingReceiptProps) => {
  const previewText = `Booking Confirmation - ${orderId}`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Booking Confirmed</Heading>
          <Text style={text}>
            Dear {customerName},
          </Text>
          <Text style={text}>
            Thank you for booking with Saigon River Star. Your payment has been successfully processed.
          </Text>

          <Section style={box}>
            <Text style={paragraph}><strong>Order ID:</strong> {orderId}</Text>
            <Text style={paragraph}><strong>Tour:</strong> {tourName}</Text>
            {tourDate && <Text style={paragraph}><strong>Date:</strong> {tourDate}</Text>}
            <Text style={paragraph}><strong>Guests:</strong> {guests}</Text>
            <Text style={paragraph}><strong>Total Paid:</strong> {Number(amount).toLocaleString('vi-VN')} VND</Text>
            <Text style={paragraph}><strong>Payment Ref:</strong> {paymentRef}</Text>
          </Section>

          <Hr style={hr} />

          <Text style={text}>
            Please arrive at the pier 15 minutes before departure.
          </Text>
          
          <Text style={footer}>
            Saigon River Star<br />
            Hotline: +84 123 456 789<br />
            Email: bookings@saigonriverstar.com
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

// Styles
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
};

const h1 = {
  color: '#333',
  fontSize: '24px',
  fontWeight: 'bold',
  textAlign: 'center' as const,
  margin: '30px 0',
};

const text = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '26px',
  padding: '0 20px',
};

const box = {
  padding: '20px',
  backgroundColor: '#f9f9f9',
  borderRadius: '5px',
  margin: '20px',
};

const paragraph = {
  fontSize: '16px',
  lineHeight: '24px',
  margin: '10px 0',
  color: '#333',
};

const hr = {
  borderColor: '#e6ebf1',
  margin: '20px 0',
};

const footer = {
  color: '#8898aa',
  fontSize: '12px',
  lineHeight: '16px',
  textAlign: 'center' as const,
  marginTop: '20px',
};

export default BookingReceipt;
