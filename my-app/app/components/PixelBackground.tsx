"use client";

import WebcamPixelGrid from "@/app/api/components/WebcamPixelGrid";

export default function PixelBackground() {
  return (
    <>
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
      <div className="absolute inset-0 z-10 bg-black/65" />
    </>
  );
}
