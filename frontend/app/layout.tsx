import type { Metadata } from "next";
import "./globals.css";
import MobileLayout from "@/components/MobileLayout";

export const metadata: Metadata = {
  title: "RestaurantGuard — AI Compliance Copilot",
  description: "AI-powered food safety compliance for independent restaurants",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900 antialiased">
        <MobileLayout>{children}</MobileLayout>
      </body>
    </html>
  );
}