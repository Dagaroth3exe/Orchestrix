import type { Metadata } from "next";
import { Cormorant_Garamond, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import ScoreBackground from "./components/ScoreBackground";
import { DarkModeProvider, themeInitScript } from "./context/DarkMode";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  style: ["normal", "italic"],
  weight: ["500", "600", "700"],
});

const mono = JetBrains_Mono({
  variable: "--font-mono-face",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Orchestrix",
  description: "Orchestrix conducts your day — notes, tasks, cues and focus, arranged like a score.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className={`${inter.variable} ${cormorant.variable} ${mono.variable} font-sans antialiased`}>
        <DarkModeProvider>
          <div className="relative h-dvh w-full overflow-hidden">
            <ScoreBackground />
            <div className="relative z-10 h-full">{children}</div>
          </div>
        </DarkModeProvider>
      </body>
    </html>
  );
}
