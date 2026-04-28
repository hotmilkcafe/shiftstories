import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "This Is Gonna Hurt",
  description: "Anonymous confessions from medical workers.",
  openGraph: {
    title: "This Is Gonna Hurt",
    description: "Anonymous confessions from medical workers.",
    url: "https://www.shiftstories.fyi/doctors",
    siteName: "This Is Gonna Hurt",
    images: [
      {
        url: "https://www.shiftstories.fyi/og-doctors.png",
        width: 1200,
        height: 630,
        alt: "This Is Gonna Hurt — anonymous medical confessions",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "This Is Gonna Hurt",
    description: "Anonymous confessions from medical workers.",
    images: ["https://www.shiftstories.fyi/og-doctors.png"],
  },
};

export default function DoctorsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
