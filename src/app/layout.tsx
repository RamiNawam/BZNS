import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'BZNS — Micro-Business Launchpad',
  description:
    'Your AI-powered guide to launching a micro-business in Quebec. Personalized roadmaps, funding matches, and financial snapshots.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
