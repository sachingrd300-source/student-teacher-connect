
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { FirebaseClientProvider } from "@/firebase/client-provider";
import { cn } from "@/lib/utils";
import { OfflineIndicator } from "@/components/offline-indicator";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Achievers Community - Home Tutors in Giridih",
  description: "Join the best community of home tutors in Giridih. Find opportunities and grow with us.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          inter.variable
        )}
      >
        <OfflineIndicator />
        <FirebaseClientProvider>{children}</FirebaseClientProvider>
      </body>
    </html>
  );
}
