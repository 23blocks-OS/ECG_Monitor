import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/components/AuthWrapper";
import AuthWrapper from "@/components/AuthWrapper";

export const metadata: Metadata = {
  title: "ECG Provider Portal",
  description: "Provider portal for ECG monitoring - Multi-patient viewing and organization management",
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
          <AuthWrapper>
            {children}
          </AuthWrapper>
        </AuthProvider>
      </body>
    </html>
  );
}
