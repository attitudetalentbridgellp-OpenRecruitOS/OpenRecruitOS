import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "OpenRecruitOS — The Open Source Recruitment Operating System",
  description:
    "OpenRecruitOS is a simple, self-hostable, open-source Applicant Tracking System by Attitude360. Jobs, candidates, pipeline, interviews and dashboard.",
  keywords: ["ATS", "Applicant Tracking System", "Open Source", "Recruitment", "OpenRecruitOS", "Attitude360"],
  authors: [{ name: "Attitude360" }],
  icons: {
    icon: "/logo.svg",
  },
  openGraph: {
    title: "OpenRecruitOS",
    description: "The Open Source Recruitment Operating System — by Attitude360",
    siteName: "OpenRecruitOS",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0d9463",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
