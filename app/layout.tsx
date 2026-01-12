import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kasi Courier Services",
  description: "B2B Logistics Delivery Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
