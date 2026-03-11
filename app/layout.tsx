import type { Metadata } from 'next';
import { Baloo_2, Nunito, Noto_Sans_Devanagari } from 'next/font/google';
import './globals.css';

const baloo = Baloo_2({
  subsets: ['latin', 'devanagari'],
  variable: '--font-baloo',
  display: 'swap'
});

const nunito = Nunito({
  subsets: ['latin'],
  variable: '--font-nunito',
  display: 'swap'
});

const notoDevanagari = Noto_Sans_Devanagari({
  subsets: ['devanagari'],
  variable: '--font-devanagari',
  display: 'swap'
});

export const metadata: Metadata = {
  title: 'Shabd Beta',
  description: "Shabd — India's first screen-free AI voice learning companion for kids."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${baloo.variable} ${nunito.variable} ${notoDevanagari.variable}`}>
        <div className="floating-particles" />
        {children}
      </body>
    </html>
  );
}

