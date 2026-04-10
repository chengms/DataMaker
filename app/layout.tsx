import type { Metadata } from "next";
import { Manrope } from "next/font/google";

import "@/app/globals.css";

import { Toaster } from "@/components/ui/sonner";

const manrope = Manrope({
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Multi-Platform Content Studio",
  description: "Single input, multi-platform output workspace.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className={manrope.className}>
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
