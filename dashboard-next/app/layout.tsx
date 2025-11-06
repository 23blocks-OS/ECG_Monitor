import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ECG Monitor Dashboard",
  description: "Real-time ECG monitoring dashboard with advanced analytics",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
