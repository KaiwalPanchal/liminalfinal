import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Liminal",
  description: "Your thoughts, but better organized than your sock drawer",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html className="dark" lang="en">
      <body className={` antialiased`}>{children}</body>
    </html>
  );
}
