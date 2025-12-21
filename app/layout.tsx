import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const geistMono = Geist_Mono({
  weight: ["400", "500", "600", "700","800","900"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Trip Planner - Map Your Journey",
  description:
    "Plan your trips with interactive maps and day-by-day itineraries",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={` ${geistMono.className} antialiased`}>
        {children}
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}
