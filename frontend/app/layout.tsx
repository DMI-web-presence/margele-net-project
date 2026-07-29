import type { Metadata } from "next";
import AppChrome from "@/components/app-chrome";
import { Geist, Geist_Mono } from "next/font/google";
import { defaultSeoDescription, defaultSeoTitle, siteName, siteUrl } from "@/lib/seo";
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
  metadataBase: new URL(siteUrl),
  title: {
    default: defaultSeoTitle,
    template: `%s | ${siteName}`,
  },
  description: defaultSeoDescription,
  applicationName: siteName,
  authors: [{ name: siteName }],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "ro_RO",
    siteName,
    title: defaultSeoTitle,
    description: defaultSeoDescription,
    url: siteUrl,
    images: [{ url: "/favicon.png", alt: siteName }],
  },
  twitter: {
    card: "summary_large_image",
    title: defaultSeoTitle,
    description: defaultSeoDescription,
    images: ["/favicon.png"],
  },
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
    apple: "/favicon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ro"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <AppChrome>{children}</AppChrome>
      </body>
    </html>
  );
}
