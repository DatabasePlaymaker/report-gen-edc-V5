import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Report Generator — PT CSI",
  description: "Generator laporan foto lapangan dengan export PDF",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
