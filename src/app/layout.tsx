import type { Metadata, Viewport } from "next";
import { JetBrains_Mono, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
});

const jetBrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "Labyrinth of Riddles",
  description:
    "Endless daily mazes with fog-of-war exploration, riddle-locked gates, per-level unique riddles, and a daily leaderboard.",
  openGraph: {
    title: "Labyrinth of Riddles",
    description:
      "Endless daily mazes with fog-of-war exploration, riddle-locked gates, per-level unique riddles, and a daily leaderboard.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Labyrinth of Riddles",
    description:
      "Endless daily mazes with fog-of-war exploration, riddle-locked gates, per-level unique riddles, and a daily leaderboard.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${plusJakarta.variable} ${jetBrainsMono.variable}`}>
      <body className="antialiased selection:bg-[#1f5fd6]/15 selection:text-[#0a1f44]">
        {children}
      </body>
    </html>
  );
}
