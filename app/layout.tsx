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
    "Northeastern University",
    "recreation center",
    "live stats",
  ],
  authors: [{ name: "Marino Stats" }],
  creator: "Marino Stats",
  publisher: "Marino Stats",
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    title: "Marino Stats",
    description:
      "Live and historical recreation facility utilization analytics for Northeastern campus locations.",
    type: "website",
    siteName: "Marino Stats",
    locale: "en_US",
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
      { url: "/favicon.ico", sizes: "any" },
    ],
    apple: [
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    shortcut: [{ url: "/icon.svg", type: "image/svg+xml" }],
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Marino Stats",
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
