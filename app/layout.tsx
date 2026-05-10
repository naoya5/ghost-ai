import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";

import { clerkAppearance } from "@/lib/clerk-appearance";
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
  const signInUrl = process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL ?? "/sign-in";

  return (
    <ClerkProvider appearance={clerkAppearance} afterSignOutUrl={signInUrl}>
      <html
        lang="en"
        className={cn("h-full antialiased", geistSans.variable, geistMono.variable)}
      >
        <body className="min-h-full flex flex-col bg-base text-copy-primary">
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
