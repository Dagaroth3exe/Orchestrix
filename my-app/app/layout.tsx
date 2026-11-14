import type { Metadata } from "next";
import { Bricolage_Grotesque, JetBrains_Mono, Lora, Outfit } from "next/font/google";
import "./globals.css";
import ScoreBackground from "./components/ScoreBackground";
import AuthCookieSync from "./components/AuthCookieSync";
import { DarkModeProvider, themeInitScript } from "./context/DarkMode";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

const lora = Lora({
  variable: "--font-lora",
  subsets: ["latin"],
  style: ["italic"],
  weight: ["400", "600"],
});

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

const mono = JetBrains_Mono({
  variable: "--font-mono-face",
  subsets: ["latin"],
  weight: ["400", "500"],
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
      <body className={`${outfit.variable} ${lora.variable} ${mono.variable} ${bricolage.variable} font-sans antialiased`}>
        <DarkModeProvider>
          <AuthCookieSync />
          <div className="relative h-dvh w-full overflow-hidden">
            <ScoreBackground />
            <div className="relative z-10 h-full">{children}</div>
          </div>
        </DarkModeProvider>
      </body>
    </html>
  );
}
