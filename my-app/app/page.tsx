"use client";

import IntroPage from "./Pages/IntroPages";
import WebcamPixelGrid from "@/app/components/WebcamPixelGrid";

export default function Home() {
  return (
    <div className="relative min-h-screen w-full overflow-hidden">

      {/* 🔵 PIXEL WEBCAM BACKGROUND (ABSTRACT & CALM) */}
      <div className="absolute inset-0 z-0 hidden md:block">
        <WebcamPixelGrid
          className="h-full w-full"
          gridCols={32}
          gridRows={24}
          colorMode="monochrome"
          monochromeColor="#4f7cff"   
          darken={0.4}                
          gapRatio={0.25}
          maxElevation={8}
          borderOpacity={0.025}
        />
      </div>

      {/* 🔴 DARK OVERLAY (EDITORIAL READABILITY) */}
      <div className="absolute inset-0 z-10 bg-black/65" />

      {/* 🟢 FOREGROUND CONTENT */}
      <div className="relative z-20 min-h-screen">
        <IntroPage />
      </div>

    </div>
  );
}
