// app/layout.js

import { ClerkProvider } from '@clerk/nextjs';
import localFont from 'next/font/local';
import './globals.css';
import Navigation from '../components/Navigation'; // We'll create this component

const geistSans = localFont({
  src: './fonts/GeistVF.woff',
  variable: '--font-geist-sans',
  weight: '100 900',
});

const geistMono = localFont({
  src: './fonts/GeistMonoVF.woff',
  variable: '--font-geist-mono',
  weight: '100 900',
});

export const metadata = {
  title: 'Learn Minimal',
  description: 'A minimal learning plan application.',
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
        <body className="bg-black text-gray-100">
          <Navigation />
          <main>{children}</main>
        </body>
      </html>
    </ClerkProvider>
  );
}
