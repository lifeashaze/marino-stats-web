import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Marino Stats",
    template: "%s | Marino Stats",
  },
  description:
    "Live and historical recreation facility utilization analytics for Northeastern campus locations.",
  applicationName: "Marino Stats",
  keywords: [
    "Marino",
    "Northeastern Recreation",
    "facility utilization",
    "capacity analytics",
    "gym occupancy",
  ],
  openGraph: {
    title: "Marino Stats",
    description:
      "Live and historical recreation facility utilization analytics for Northeastern campus locations.",
    type: "website",
    siteName: "Marino Stats",
  },
  twitter: {
    card: "summary",
    title: "Marino Stats",
    description:
      "Live and historical recreation facility utilization analytics for Northeastern campus locations.",
  },
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico" },
    ],
    shortcut: [{ url: "/icon.svg", type: "image/svg+xml" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="light">
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
}
