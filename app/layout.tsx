import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DealCheck LB — Is it a good deal?",
  description:
    "Paste any Lebanese marketplace listing and get a risk score, price check, red flags, and negotiation advice. Built for cars, phones, laptops and more.",
  keywords: ["Lebanon marketplace", "deal check", "OLX Lebanon", "Facebook Marketplace", "used cars Lebanon", "buyer protection"],
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico" },
    ],
    shortcut: ["/favicon.svg"],
    apple: [{ url: "/dealcheck-logo-mark.svg", type: "image/svg+xml" }],
  },
  openGraph: {
    title: "DealCheck LB",
    description: "Check if a deal is worth it before you buy.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <Navbar />
        <main className="flex-1 pt-16">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
