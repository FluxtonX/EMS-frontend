import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '@/components/layout/Providers';

export const metadata: Metadata = {
  title: 'Workforce Operations Platform',
  description: 'Enterprise workforce and security management SaaS platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-[#F5F3FF] text-[#171A2B] min-h-screen antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
