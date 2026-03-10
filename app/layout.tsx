import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title:       'Duck Hunt — Neon Edition',
  description: 'A retro-neon browser Duck Hunt game. Click to shoot ducks across the neon sky!',
  keywords:    ['duck hunt', 'game', 'browser game', 'neon', 'retro', 'shooting game'],
  authors:     [{ name: 'Duck Hunt Neon' }],
  icons: {
    icon: '/favicon.svg',
  },
  openGraph: {
    title:       'Duck Hunt — Neon Edition',
    description: 'A retro-neon browser Duck Hunt. Click to shoot!',
    type:        'website',
  },
};

export const viewport: Viewport = {
  width:        'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor:   '#050010',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="w-screen h-screen overflow-hidden bg-[#050010]">
        {children}
      </body>
    </html>
  );
}
