import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { PreferencesProvider } from "@/app/components/Preferences";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Crown Ledger",
  description: "A local-first personal finance dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const preferenceScript = `
    (() => {
      try {
        const theme = localStorage.getItem("crown.theme") ||
          (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
        const language = localStorage.getItem("crown.language") || "en";
        document.documentElement.dataset.theme = theme;
        document.documentElement.lang = language;
      } catch {}
    })();
  `;

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full">
        <script dangerouslySetInnerHTML={{ __html: preferenceScript }} />
        <PreferencesProvider>{children}</PreferencesProvider>
      </body>
    </html>
  );
}
