import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ZuZaWorksOS - Building South Africa Together',
  description: 'Comprehensive workforce operating system for South African businesses',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-gradient-to-br from-[#a8d5e2] via-[#7ec8e3] to-[#c7e3f0] bg-fixed">
        {children}
      </body>
    </html>
  );
}
