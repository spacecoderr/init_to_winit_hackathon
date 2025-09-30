import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Aranya FRA Atlas & Decision Support System",
  description: "AI-powered FRA document digitisation, spatial monitoring & scheme recommendation dashboard",
  icons: [{ rel: 'icon', url: '/favicon.ico' }],
  applicationName: 'Aranya FRA DSS',
  keywords: ['FRA', 'Forest Rights Act', 'WebGIS', 'Decision Support System', 'Schemes', 'AI', 'OCR', 'Spatial'],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-full bg-[var(--color-surface-alt)] text-[var(--foreground)]`}
      >
        <a href="#main" className="skip-link">Skip to main content</a>
        {children}
      </body>
    </html>
  );
}
