import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Navbar from "@/components/Navbar";
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
  title: "TripshotTracker - VRDC Thailand Photo Contest",
  description:
    "Team photo contest for the VRDC Thailand business trip. Submit, vote, and celebrate the best moments!",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const theme = localStorage.getItem('theme');
                if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.documentElement.classList.add('dark');
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <Navbar />
        <main className="flex-1 pt-16">{children}</main>
        <footer className="border-t border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-gray-950/50 backdrop-blur-sm">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <img
                src="/logo-nvidia.png"
                alt="NVIDIA"
                width={32}
                height={32}
                className="rounded"
              />
              <div className="text-sm text-gray-500 dark:text-gray-400">
                <span className="font-semibold text-gray-700 dark:text-gray-300">NVIDIA</span>
                {" "}VRDC Thailand Trip 2026
              </div>
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              Built with TripshotTracker
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
