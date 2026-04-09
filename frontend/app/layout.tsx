import type { Metadata, Viewport } from "next";
import "./globals.css";
import MobileLayout from "@/components/MobileLayout";
import { ToastProvider } from "@/components/Toast";

export const metadata: Metadata = {
  metadataBase: new URL("https://restaurantguard.app"),
  title: {
    default: "RestaurantGuard — AI Compliance Copilot for Food Service",
    template: "%s · RestaurantGuard",
  },
  description:
    "AI-powered food safety compliance for independent restaurants, ghost kitchens, and caterers. Auto-generate HACCP checklists, track inspections, and stay ahead of health department visits.",
  applicationName: "RestaurantGuard",
  keywords: [
    "restaurant compliance",
    "food safety",
    "HACCP checklist",
    "health inspection",
    "restaurant software",
    "corrective action tracking",
  ],
  authors: [{ name: "RestaurantGuard" }],
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    title: "RestaurantGuard — AI Compliance Copilot",
    description:
      "AI-powered food safety compliance for independent restaurants and food service SMBs.",
    siteName: "RestaurantGuard",
  },
  twitter: {
    card: "summary_large_image",
    title: "RestaurantGuard — AI Compliance Copilot",
    description:
      "AI-powered food safety compliance for independent restaurants and food service SMBs.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#065f46",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900 antialiased">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:bg-emerald-700 focus:text-white focus:px-4 focus:py-2 focus:rounded-lg focus:shadow-lg"
        >
          Skip to main content
        </a>
        <ToastProvider>
          <MobileLayout>{children}</MobileLayout>
        </ToastProvider>
      </body>
    </html>
  );
}