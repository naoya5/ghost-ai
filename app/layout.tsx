import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { EditorShell } from "@/components/editor/editor-shell";
import { cn } from "@/lib/utils";
import "./globals.css";

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: "ghost ai",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn("h-full antialiased", geistSans.variable, geistMono.variable)}
    >
      <body className="min-h-full flex flex-col bg-base text-copy-primary">
        <EditorShell>{children}</EditorShell>
      </body>
    </html>
  );
}
