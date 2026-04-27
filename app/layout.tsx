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
  title: "ShiftStories",
  description: "Customer reviews. Written by the staff, not the other way round.",
  openGraph: {
    title: "ShiftStories",
    description: "Customer reviews. Written by the staff, not the other way round.",
    url: "https://www.shiftstories.fyi",
    siteName: "ShiftStories",
    images: [
      {
        url: "https://www.shiftstories.fyi/og-default.png",
        width: 1200,
        height: 630,
        alt: "ShiftStories — customer reviews written by the staff",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ShiftStories",
    description: "Customer reviews. Written by the staff, not the other way round.",
    images: ["https://www.shiftstories.fyi/og-default.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
