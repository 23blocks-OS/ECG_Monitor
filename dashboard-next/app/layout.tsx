import type { Metadata } from "next";
import { AuthProvider } from "@/components/Auth";
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
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
