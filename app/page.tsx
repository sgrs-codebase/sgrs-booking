import { redirect } from 'next/navigation';

export default function Home() {
  // Redirect to booking page with default tour
  redirect('/booking?tourId=cu-chi-tunnels');
}
