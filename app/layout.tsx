import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { cn } from '@/lib/utils';
import { Providers } from '@/components/providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  metadataBase: new URL('https://fyp.gg'),
  title: 'FYP',
  description: "OMG! Here you can vibecode an online multiplayer game and play with your friends",

  openGraph: {
    title: 'FYP',
    description: "OMG! Here you can vibecode an online multiplayer game and play with your friends",
    images: [
      {
        url: '/images/opengraph.png',
        width: 1200,
        height: 630,
      },
    ],
  },

  twitter: {
    card: 'summary_large_image',
    title: 'FYP',
    description: "OMG! Here you can vibecode an online multiplayer game and play with your friends",
    images: ['/images/opengraph.png'],
  },

  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn(inter.className, 'antialiased')}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
