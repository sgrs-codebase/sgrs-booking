import type { Metadata } from "next";
import { Libre_Bodoni } from "next/font/google";
import "@/styles/main.scss";

// Load Libre Bodoni (Google Font)
const libreBodoni = Libre_Bodoni({
  subsets: ['latin'],
  weight: ['400', '700'],
  style: ['normal', 'italic'],
  variable: '--font-libre-bodoni',
  display: 'swap',
});

export const metadata: Metadata = {
  title: "Book Your Tour | Saigon River Star",
  description: "Book your waterway tours with Saigon River Star - Experience the beauty of Vietnam's rivers",
  keywords: ["Saigon River", "Vietnam tours", "boat tours", "Cu Chi Tunnels", "Mekong Delta"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Load Mona Sans from GitHub */}
        <link
          href="https://api.fontshare.com/v2/css?f[]=mona-sans@500,700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={libreBodoni.variable}>
        {children}
      </body>
    </html>
  );
}
