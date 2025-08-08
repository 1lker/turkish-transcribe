// src/app/layout.tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from 'sonner'; // sonner'dan import

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Turkish Transcription AI',
  description: 'Advanced AI-powered transcription system optimized for Turkish',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr" className="dark">
      <body className={inter.className}>
        {children}
        <Toaster 
          theme="dark"
          position="bottom-right"
          toastOptions={{
            style: {
              background: 'rgb(17 24 39)',
              border: '1px solid rgb(31 41 55)',
              color: 'rgb(243 244 246)',
            },
            className: 'my-toast',
          }}
        />
      </body>
    </html>
  );
}