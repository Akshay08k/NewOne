import type { Metadata } from "next";
import { Inter } from "next/font/google"; // Use Inter as a fallback
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/context/auth-context"; // Import AuthProvider
import { Analytics } from "@vercel/analytics/react"; // Import for vercel analyzer
// Use Inter font. We keep the Geist variable names for potential future use if Geist is installed.
const geistSansFont = Inter({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});
const geistMonoFont = Inter({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: "TaskFlow",
  description: "Advanced Task Management Application",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSansFont.variable} ${geistMonoFont.variable} font-sans antialiased`} // Use font-sans utility
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            {/* Wrap children with AuthProvider */}
            {children}
            <Analytics />
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
