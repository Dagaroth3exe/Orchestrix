import type { Metadata } from "next";
import { Lora, Outfit } from "next/font/google";
import "./globals.css";
import PixelBackground from "./components/PixelBackground";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

const lora = Lora({
  variable: "--font-lora",
  subsets: ["latin"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "Orchestrix",
  description: "Your personal productivity hub — notes, tasks, alerts and focus timer in one place.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${outfit.variable} ${lora.variable} antialiased`}>
        <div className="relative h-screen w-full overflow-hidden">
          <PixelBackground />
          <div className="relative z-20 h-full">{children}</div>
        </div>
      </body>
    </html>
  );
}
