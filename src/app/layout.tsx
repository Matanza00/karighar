import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/Toast";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "KARIGHAR — Verified home-service pros in Karachi",
  description:
    "Book verified plumbers, electricians and AC technicians in Karachi. Fixed prices, live tracking, satisfaction guaranteed.",
  applicationName: "KARIGHAR",
  appleWebApp: { capable: true, title: "KARIGHAR", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: "#0f766e",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col text-slate-900">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
