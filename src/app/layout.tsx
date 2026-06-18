import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import CampaignTracker from '@/components/CampaignTracker';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Masti Reload',
  description: 'Masti Hai To Mast Hai',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <CampaignTracker />
      </body>
    </html>
  );
}
