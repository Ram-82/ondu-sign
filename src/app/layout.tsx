import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ondu Sign",
  description: "One Platform. Secure Signatures.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
