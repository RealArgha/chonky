import type { Metadata, Viewport } from "next";
import { Geist_Mono, Press_Start_2P } from "next/font/google";
import { PixelClouds } from "@/components/PixelClouds";
import "./globals.css";

const pixelFont = Press_Start_2P({
  variable: "--font-pixel",
  weight: "400",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Chonky",
  description: "Your pet capybara. Feed, sleep, bath, and play with Chonky.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Chonky",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#bfe7ff",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${pixelFont.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <PixelClouds />
        {children}
      </body>
    </html>
  );
}
